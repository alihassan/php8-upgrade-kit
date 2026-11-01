import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-fgetss',
  title: 'fgetss() and gzgetss() were removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['fgetss', 'gzgetss'],
  explanation:
    'fgetss() read a line from a file and stripped HTML tags from it in one step. PHP 8 removed it. Read the line with fgets() and strip the tags with strip_tags().',
  before: `$line = fgetss($handle);`,
  after: `$line = strip_tags(fgets($handle));`,
  docUrl: DOC.m80incompat,
});
