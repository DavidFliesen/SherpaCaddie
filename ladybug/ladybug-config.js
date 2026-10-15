/*
 * ARTEZIQ Feedback — Sherpa Caddie PUBLIC configuration.
 *
 * These are the browser-safe public values for Sherpa Caddie's active
 * ARTEZIQ Feedback app record.
 * Never replace either value with a service-role key, Management API token,
 * GitHub token, or password.
 */
export const LADYBUG_CONFIG = {
  supabaseUrl: 'https://mehsjriwijsyquhmrzkh.supabase.co',
  publishableKey: 'sb_publishable_GJzFbU63AAgok24gxPrnSA_FL0H3kfu',
  appKey: '1c95828f-b883-4cd8-9486-d7a16ff50b2b',
  slug: 'sherpa-caddie',
  iconUrl: 'ladybug/assets/ladybug-feedback-icon-256.png',
  bottomOffsetPx: 16,
  bottomOffsetPhonePx: 12,
};

export function ladybugConfigured(cfg = LADYBUG_CONFIG) {
  const real = (value, minimum) =>
    typeof value === 'string' && value.length >= minimum &&
    !/^REPLACE/i.test(value) && !/\s/.test(value);
  return real(cfg.publishableKey, 20) && real(cfg.appKey, 8) && real(cfg.slug, 3);
}
