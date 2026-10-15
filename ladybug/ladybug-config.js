/*
 * ARTEZIQ Feedback — Sherpa Caddie PUBLIC configuration.
 *
 * Fill in the Supabase publishable key and Sherpa Caddie's Public ingest key
 * from the ARTEZIQ Feedback dashboard. These are browser-safe public values.
 * Never place a service-role key, Management API token, GitHub token, or
 * password in this file.
 *
 * Until both placeholders are replaced, Sherpa Caddie continues normally and
 * the Ladybug launcher stays hidden.
 */
export const LADYBUG_CONFIG = {
  supabaseUrl: 'https://mehsjriwijsyquhmrzkh.supabase.co',
  publishableKey: 'REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY',
  appKey: 'REPLACE_WITH_SHERPA_CADDIE_PUBLIC_INGEST_KEY',
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
