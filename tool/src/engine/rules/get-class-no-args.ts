import { args, callRule, DOC } from './_helpers';

export default callRule({
  id: 'get-class-no-args',
  title: 'get_class() and get_parent_class() without an argument are deprecated',
  phpVersion: '8.3',
  severity: 'deprecated',
  names: ['get_class', 'get_parent_class'],
  when: (call) => args(call).length === 0,
  explanation:
    'Inside a class, get_class() with nothing in the brackets returns the class name. PHP 8.3 deprecated the empty form. Use self::class (or static::class) instead, or pass $this.',
  before: `log_line(get_class() . ' started');`,
  after: `log_line(self::class . ' started');\n// parent class: get_parent_class($this)`,
  docUrl: DOC.m83deprecated,
});
