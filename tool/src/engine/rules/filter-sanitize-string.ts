import { constRule, DOC } from './_helpers';

export default constRule({
  id: 'filter-sanitize-string',
  title: 'FILTER_SANITIZE_STRING is deprecated',
  phpVersion: '8.1',
  severity: 'deprecated',
  constants: ['FILTER_SANITIZE_STRING', 'FILTER_SANITIZE_STRIPPED'],
  explanation:
    'This filter stripped HTML tags from form input. It was often mistaken for real protection against attacks, and PHP 8.1 deprecated it. Keep the raw input, validate it, and escape it with htmlspecialchars() when you print it on a page.',
  before: `$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);\necho $name;`,
  after: `$name = trim((string) filter_input(INPUT_POST, 'name'));\necho htmlspecialchars($name, ENT_QUOTES, 'UTF-8');`,
  docUrl: DOC.m81deprecated,
});
