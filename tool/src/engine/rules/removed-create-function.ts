import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'removed-create-function',
  title: 'create_function() was removed',
  phpVersion: '8.0',
  severity: 'fatal',
  names: ['create_function'],
  explanation:
    'create_function() built a small function out of a text string. It was slow and unsafe, and PHP 8 removed it. Pages that use it crash. An anonymous function (a closure) replaces it directly.',
  before: `usort($rows, create_function('$a, $b', 'return $a["price"] - $b["price"];'));`,
  after: `usort($rows, function ($a, $b) {\n    return $a['price'] - $b['price'];\n});`,
  docUrl: DOC.m80incompat,
});
