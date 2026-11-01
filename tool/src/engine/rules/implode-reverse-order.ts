import { args, callRule, DOC, isStringLiteral } from './_helpers';

export default callRule({
  id: 'implode-reverse-order',
  title: 'implode() with the array first is no longer allowed',
  phpVersion: '8.0',
  severity: 'fatal',
  detection: 'heuristic',
  detectionNote: 'Fires when the second argument is a plain string and the first is not. It cannot see the type of variables.',
  names: ['implode', 'join'],
  when: (call) => {
    const [a, b] = args(call);
    return !!a && !!b && isStringLiteral(b) && !isStringLiteral(a);
  },
  explanation:
    'implode() joins a list into one piece of text. PHP used to accept the list and the separator in either order. PHP 8 only accepts the separator first, and the other order throws an error.',
  before: `echo implode($tags, ', ');`,
  after: `echo implode(', ', $tags);`,
  docUrl: DOC.m80incompat,
});
