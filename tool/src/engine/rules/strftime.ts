import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'strftime',
  title: 'strftime(), gmstrftime() and strptime() are deprecated',
  phpVersion: '8.1',
  severity: 'deprecated',
  names: ['strftime', 'gmstrftime', 'strptime'],
  explanation:
    'These functions format and read dates using the server\'s language settings. They behaved differently from one server to the next, and PHP 8.1 deprecated them. Use date() or DateTime for fixed formats, or IntlDateFormatter for month and day names in other languages.',
  before: `echo strftime('%d %B %Y', $timestamp);`,
  after: `echo date('d F Y', $timestamp);\n// translated month names:\n$fmt = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);\necho $fmt->format($timestamp);`,
  docUrl: DOC.m81deprecated,
});
