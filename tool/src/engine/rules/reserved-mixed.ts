import { DOC, reservedNameVisitor } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'reserved-mixed',
  title: '"mixed" can no longer be a class name',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'PHP 8 added "mixed" as a built-in type, which means "any value". A class, interface or trait called Mixed now clashes with it and the file will not load. Rename the class.',
  before: `class Mixed { ... }`,
  after: `class MixedValue { ... }`,
  docUrl: DOC.m80incompat,
  visit: reservedNameVisitor(['mixed']),
};
export default rule;
