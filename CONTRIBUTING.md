# Contributing

Thanks for helping. The most useful contributions are new rules, fixes for
false positives, and real-world code samples that the checker gets wrong.

## Adding a rule

Every rule is one file in `tool/src/engine/rules/`, named after its id, with
two fixtures next to the tests. CI fails if any of these pieces is missing.

1. **Find the source.** A rule must point to the official PHP migration guide
   (`https://www.php.net/manual/en/migrationXY.*.php`) or an accepted RFC
   (`https://wiki.php.net/rfc/...`). If you can't link one, it isn't a rule yet.

2. **Write the module**, for example `tool/src/engine/rules/removed-thing.ts`:

   ```ts
   import { callRule, DOC } from './_helpers';

   export default callRule({
     id: 'removed-thing',               // same as the file name
     title: 'thing() was removed',
     phpVersion: '8.0',                 // first version where it breaks or warns
     severity: 'fatal',                 // 'fatal' | 'deprecated' | 'behavior-change'
     names: ['thing'],                  // function names to match
     explanation: 'Plain English for someone who does not write PHP. Say what breaks and what to do.',
     before: `thing($x);`,
     after: `other_thing($x);`,
     docUrl: DOC.m80incompat,
   });
   ```

   `callRule` and `constRule` cover functions and constants. For anything else,
   export a `Rule` with a `visit` map of node kinds (see `curly-offset.ts` or
   `php4-constructor.ts`). Rules whose `detection` is `heuristic`,
   `parse-error` or `ast+source` must also set `detectionNote`, saying plainly
   what they can miss.

3. **Register it** in `tool/src/engine/rules/index.ts` (keep the list sorted).

4. **Add fixtures**: `tool/test/fixtures/<id>/match.php` must trigger the rule
   at least once, and `tool/test/fixtures/<id>/ok.php` must not trigger it at all.
   Put the near misses in `ok.php`: the code that looks similar but is fine.

5. **Run the tests**: `cd tool && npm test`.

## Writing style for explanations

The reader is often a business owner whose site just broke. Keep it short and
concrete: what happens, why, what to change. No jargon without a one-line
explanation, and no em dashes.

## Reporting a false positive

Use the "False positive" issue template and include the smallest code sample
that reproduces it. Please remove anything private first.

## Running the walkthrough locally

See [walkthrough/README.md](walkthrough/README.md). You need PHP 7.4 and 8.3
(or Docker) and a MySQL or MariaDB server.
