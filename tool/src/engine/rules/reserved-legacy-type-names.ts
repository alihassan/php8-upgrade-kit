import { DOC, reservedNameVisitor } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'reserved-legacy-type-names',
  title: 'Class names that PHP 7 reserved',
  phpVersion: '7.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'PHP 7 turned words like int, string, bool, float, void, iterable and object into built-in types. Very old code that used them as class names (often "class String" or "class Object") does not load on PHP 7 or 8. Rename the class.',
  before: `class Object { ... }`,
  after: `class BaseObject { ... }`,
  docUrl: DOC.m70incompat,
  visit: reservedNameVisitor(['int', 'float', 'bool', 'string', 'true', 'false', 'null', 'void', 'iterable', 'object']),
};
export default rule;
