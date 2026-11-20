import { defineConfig } from 'astro/config';

// موقع ثابت يُبنى على Cloudflare Pages، ويُعاد بناؤه تلقائياً كلّما نُشرت مادّة في Sanity.
export default defineConfig({
  site: 'https://axiomplusmedia.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
