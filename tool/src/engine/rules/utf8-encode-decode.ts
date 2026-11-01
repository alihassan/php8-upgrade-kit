import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'utf8-encode-decode',
  title: 'utf8_encode() and utf8_decode() are deprecated',
  phpVersion: '8.2',
  severity: 'deprecated',
  names: ['utf8_encode', 'utf8_decode'],
  explanation:
    'Despite the names, these only convert between UTF-8 and one Western European encoding (ISO-8859-1). They garbled other text, and PHP 8.2 deprecated them. Use mb_convert_encoding() and say which encodings you mean.',
  before: `$name = utf8_encode($row['name']);`,
  after: `$name = mb_convert_encoding($row['name'], 'UTF-8', 'ISO-8859-1');`,
  docUrl: DOC.m82deprecated,
});
