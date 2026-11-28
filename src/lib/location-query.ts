export function normalizeLocationQuery(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '')
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
