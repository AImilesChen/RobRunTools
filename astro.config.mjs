import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import react from '@astrojs/react';
import searchFiles from './scripts/astro-search-files.mjs';
import { siteUrl } from './src/lib/site-release.mjs';
import { officialArtPreview } from './src/lib/game-media.mjs';
import { homeGameplayPreview } from './src/lib/home-game-media.mjs';

const mapPreview = {
  name: 'robrun-map-preview',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      injectRoute({ pattern: '/map', entrypoint: fileURLToPath(new URL('./src/previews/point-map.astro', import.meta.url)) });
    },
  },
};

const gameplayAssets = {
  name: 'robrun-gameplay-preview-assets',
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
  integrations: [react(), searchFiles(), ...(officialArtPreview ? [mapPreview] : []), ...(homeGameplayPreview ? [gameplayAssets] : [])],
  site: siteUrl,
});
