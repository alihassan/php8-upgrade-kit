import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-money-format',
  title: 'money_format() was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['money_format'],
  explanation:
    'money_format() turned numbers into prices like "$1,234.50". PHP 8 removed it (it never worked on Windows either). Use number_format(), or NumberFormatter from the intl extension for local currency rules.',
  before: `echo money_format('%.2n', $total);`,
  after: `echo '$' . number_format($total, 2);\n// or, with the intl extension:\n$fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);\necho $fmt->formatCurrency($total, 'USD');`,
  docUrl: DOC.m80incompat,
});
