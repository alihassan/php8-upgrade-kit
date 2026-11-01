import { DOC } from './_helpers';
import { callName } from '../ast';
import type { Node, Rule } from '../types';

const PSEUDO = new Set(['html-entities', 'html', 'qprint', 'quoted-printable', 'base64', 'uuencode']);

const rule: Rule = {
  id: 'mbstring-pseudo-encodings',
  title: 'mbstring "encodings" like HTML-ENTITIES are deprecated',
  phpVersion: '8.2',
  severity: 'deprecated',
  detection: 'ast',
  detectionNote: 'Only finds the encoding when it is written as a plain string in the call.',
  explanation:
    'A common trick was mb_convert_encoding($html, \'HTML-ENTITIES\', \'UTF-8\') to prepare text for an HTML parser. HTML-ENTITIES, Base64, QPrint and Uuencode are not real text encodings, and PHP 8.2 deprecated them in all mb_* functions. Use htmlentities(), base64_encode() or quoted_printable_encode() instead.',
  before: `$html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');\n$dom->loadHTML($html);`,
  after: `$html = htmlentities($html, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);\n// or for DOMDocument:\n$dom->loadHTML('<?xml encoding="UTF-8">' . $html);`,
  docUrl: DOC.m82deprecated,
  visit: {
    call(n, ctx) {
      const name = callName(n);
      if (!name?.startsWith('mb_')) return;
      const hit = (n.arguments ?? []).find((a: Node) => a?.kind === 'string' && PSEUDO.has(String(a.value).toLowerCase()));
      if (hit) ctx.report(n, `${name}() with "${hit.value}"`);
    },
  },
};
export default rule;
