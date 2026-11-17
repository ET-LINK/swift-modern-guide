import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const features = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/features' }),
  schema: z.object({
    id: z.string().regex(/^F\d{2}$/),
    title: z.string(),
    introduced: z.enum(['5.9', '6.0', '6.1', '6.2', '6.3', '6.4']),
    expandedIn: z.string().optional(),
    versions: z.array(z.string()),
    themes: z.array(z.enum(['concurrency', 'type-system', 'memory-ownership', 'interop', 'testing-tooling'])).min(1),
    category: z.enum(['A', 'B', 'C']),
    toolchain: z.string(),
    officialSources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .min(1)
      .refine(
        (srcs) =>
          srcs.every((s) => {
            const u = new URL(s.url);
            const host = u.hostname;
            if (host === 'swift.org' || host.endsWith('.swift.org')) return true;
            if (host === 'docs.swift.org') return true;
            if (host === 'developer.apple.com' || host.endsWith('.developer.apple.com')) return true;
            if (host === 'github.com' && u.pathname.startsWith('/swiftlang/')) return true;
            return false;
          }),
        { message: '官方来源只允许 swift.org / docs.swift.org / developer.apple.com / github.com/swiftlang' },
      ),
    sampleIds: z.array(z.string()).min(1),
    summary: z.string().min(10),
  }),
});

export const collections = { features };
