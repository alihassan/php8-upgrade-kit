import { constRule, DOC } from './_helpers';

export default constRule({
  id: 'file-binary-text',
  title: 'FILE_BINARY and FILE_TEXT are deprecated',
  phpVersion: '8.1',
  severity: 'deprecated',
  constants: ['FILE_BINARY', 'FILE_TEXT'],
  explanation:
    'These two flags never did anything. PHP 8.1 deprecated them, so they now only add warnings. Delete them.',
  before: `file_put_contents($path, $data, FILE_APPEND | FILE_BINARY);`,
  after: `file_put_contents($path, $data, FILE_APPEND);`,
  docUrl: DOC.m81deprecated,
});
