<?php

/**
 * Run each db/migrations/*.sql file that hasn't run yet, in name order, and
 * record it in schema_migrations. Returns the names it applied.
 *
 * @return list<string>
 */
function run_migrations(PDO $pdo): array
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL)');
    $done = $pdo->query('SELECT name FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);

    $files = glob(__DIR__ . '/migrations/*.sql');
    sort($files);
    $applied = [];
    foreach ($files as $file) {
        $name = basename($file);
        if (in_array($name, $done, true)) {
            continue;
        }
        foreach (sql_statements(file_get_contents($file)) as $statement) {
            $pdo->exec($statement);
        }
        $pdo->prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, NOW())')->execute([$name]);
        $applied[] = $name;
    }
    return $applied;
}

/** @return list<string> */
function sql_statements(string $sql): array
{
    $sql = preg_replace('/^--.*$/m', '', $sql);
    return array_values(array_filter(array_map(trim(...), explode(';', $sql))));
}
