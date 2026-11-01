import { args, callRule, DOC } from './_helpers';
import { constName } from '../ast';

export default callRule({
  id: 'trigger-error-user-error',
  title: 'trigger_error() with E_USER_ERROR is deprecated',
  phpVersion: '8.4',
  severity: 'deprecated',
  names: ['trigger_error', 'user_error'],
  when: (call) => {
    const level = args(call)[1];
    return constName(level, call) === 'E_USER_ERROR' || (level?.kind === 'number' && String(level.value) === '256');
  },
  explanation:
    'trigger_error(..., E_USER_ERROR) stopped the script with a custom fatal error. PHP 8.4 deprecated this. Throw an exception instead, so the error can be caught and logged properly.',
  before: `if (!$config) trigger_error('Missing config', E_USER_ERROR);`,
  after: `if (!$config) throw new RuntimeException('Missing config');`,
  docUrl: DOC.m84deprecated,
});
