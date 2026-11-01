import { DOC, reservedNameVisitor } from './_helpers';
import type { Rule } from '../types';

const rule: Rule = {
  id: 'reserved-never',
  title: '"never" can no longer be a class name',
  phpVersion: '8.1',
  severity: 'fatal',
  detection: 'ast',
  explanation:
    'PHP 8.1 added "never" as a return type for functions that never return (for example, ones that always redirect and exit). A class, interface or trait called Never now clashes with it and the file will not load. Rename it.',
  before: `class Never { ... }`,
  after: `class NeverOption { ... }`,
  docUrl: DOC.m81incompat,
  visit: reservedNameVisitor(['never']),
};
export default rule;
