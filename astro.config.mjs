import { defineConfig } from 'astro/config';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import react from '@astrojs/react';
import searchFiles from './scripts/astro-search-files.mjs';
import { siteUrl } from './src/lib/site-release.mjs';
import { homeGameplayEnabled } from './src/lib/home-game-media.mjs';

const gameplayAssets = {
  name: 'robrun-gameplay-assets',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const assetSets = [
        { directory: 'home-gameplay', output: 'gameplay-home' },
        { directory: 'item-icons', output: 'catalog-art' },
      ];
      await Promise.all(assetSets.map(async ({ directory, output }) => {
        const source = new URL('./assets/' + directory + '/', import.meta.url);
        const manifest = JSON.parse(await readFile(new URL('sources.json', source), 'utf8'));
        const target = new URL(output + '/', dir);
        await mkdir(target, { recursive: true });
        const files = new Set(Object.values(manifest).map(asset => asset.file));
        await Promise.all([...files].map(file => copyFile(new URL(file, source), new URL(file, target))));
      }));
    },
  },
};

export default defineConfig({
  integrations: [react(), searchFiles(), ...(homeGameplayEnabled ? [gameplayAssets] : [])],
  redirects: { '/map/looty-bay': '/map/' },
  site: siteUrl,
});
