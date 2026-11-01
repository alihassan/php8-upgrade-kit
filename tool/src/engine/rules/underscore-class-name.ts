import { DOC, reservedNameVisitor } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'underscore-class-name',
  title: 'A class named "_" is deprecated',
  phpVersion: '8.4',
  severity: 'deprecated',
  detection: 'ast',
  explanation:
    'PHP 8.4 deprecated using a single underscore as a class name. A few translation helpers used it. Give the class a real name.',
  before: `class _ { public static function t($s) { ... } }`,
  after: `class Translate { public static function t($s) { ... } }`,
  docUrl: DOC.m84deprecated,
  visit: reservedNameVisitor(['_']),
};
export default rule;
