import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const normalizeTag = (tag: string) =>
  tag.toLowerCase().trim().replace(/\s+/g, '-');

const docSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).transform(tags => tags.map(normalizeTag)),
});

export const collections = {
  aiTools: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './ai-tools-and-services' }),
    schema: docSchema,
  }),
  cloudPlatforms: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './cloud-ai-platforms' }),
    schema: docSchema,
  }),
  companies: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './companies' }),
    schema: docSchema,
  }),
};
