import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://loom-7kv.pages.dev',
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: false,
    },
  },
});
