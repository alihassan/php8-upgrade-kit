import { callRule, DOC } from './_helpers';

export default callRule({
  id: 'mhash',
  title: 'mhash functions are deprecated',
  phpVersion: '8.1',
  severity: 'deprecated',
  names: ['mhash', 'mhash_keygen_s2k', 'mhash_count', 'mhash_get_block_size', 'mhash_get_hash_name'],
  explanation:
    'The mhash functions are an old way to compute checksums and hashes. PHP 8.1 deprecated them. The hash() family does the same job and is always available.',
  before: `$sig = mhash(MHASH_SHA256, $payload, $secret);`,
  after: `$sig = hash_hmac('sha256', $payload, $secret, true);`,
  docUrl: DOC.m81deprecated,
});
