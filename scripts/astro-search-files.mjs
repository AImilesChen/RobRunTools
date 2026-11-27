import { readFile, writeFile } from 'node:fs/promises';
import { canonicalUrl } from '../src/lib/site-release.mjs';
import { homeGameplayPreview } from '../src/lib/home-game-media.mjs';

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export default function searchFiles() {
  return {
    name: 'robrun-search-files',
    hooks: {
      'astro:build:done': async ({ pages, dir, logger }) => {
        const urls = new Set();
        for (const { pathname } of pages) {
          const route = pathname.replace(/^\/+|\/+$/g, '');
          const file = new URL(route ? `${route}/index.html` : 'index.html', dir);
          const html = await readFile(file, 'utf8');
          const head = html.slice(0, html.indexOf('</head>'));
          // All pages using BaseLayout emit either noindex or their canonical URL.
          if (head.includes('name="robots" content="noindex"')) continue;
          const url = canonicalUrl(pathname);
          if (head.includes(`rel="canonical" href="${url}"`)) urls.add(url);
        }

        const entries = [...urls].sort().map(url => `  <url><loc>${escapeXml(url)}</loc></url>`);
        const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries,
          '</urlset>', ''].join('\n');
        const robots = homeGameplayPreview
          ? 'User-agent: *\nDisallow: /\n'
          : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', canonicalUrl('/')).href}\n`;
        await Promise.all([
          writeFile(new URL('sitemap.xml', dir), sitemap, 'utf8'),
          writeFile(new URL('robots.txt', dir), robots, 'utf8'),
        ]);
        logger.info(`${urls.size} canonical pages in sitemap.xml`);
      },
    },
  };
}
