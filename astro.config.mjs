import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// موقع حيّ على Cloudflare: تُقرأ الموادّ من Sanity عند الطلب، فلا حاجة لإعادة البناء عند كلّ نشر.
export default defineConfig({
  site: 'https://axiomplusmedia.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
