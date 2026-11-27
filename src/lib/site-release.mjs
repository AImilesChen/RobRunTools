export const siteUrl = 'https://robrun.win';
export const contactEmail = 'contact@robrun.win';
// This inbox received the Cloudflare Email Routing verification message.
export const publicContact = process.env.ROBRUN_CONTACT_VERIFIED === 'false' ? null : contactEmail;

export function canonicalUrl(pathname) {
  const path = '/' + pathname.replace(/^\/+|\/+$/g, '');
  return new URL(path === '/' ? path : path + '/', siteUrl).href;
}
