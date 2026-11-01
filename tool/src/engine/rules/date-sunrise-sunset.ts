import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'date-sunrise-sunset',
  title: 'date_sunrise() and date_sunset() are deprecated',
  phpVersion: '8.1',
  severity: 'deprecated',
  names: ['date_sunrise', 'date_sunset'],
  explanation:
    'These two functions return sunrise and sunset times. PHP 8.1 deprecated them in favour of date_sun_info(), which returns both (and twilight times) in one call.',
  before: `$rise = date_sunrise(time(), SUNFUNCS_RET_TIMESTAMP, $lat, $lng);`,
  after: `$info = date_sun_info(time(), $lat, $lng);\n$rise = $info['sunrise'];`,
  docUrl: DOC.m81deprecated,
});
