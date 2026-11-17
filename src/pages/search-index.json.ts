import type { APIRoute } from 'astro';
import { getCollection, render } from 'astro:content';

export const GET: APIRoute = async () => {
  const features = (await getCollection('features')).sort((a, b) => a.data.id.localeCompare(b.data.id));
  const entries = [];
  for (const f of features) {
    const { headings } = await render(f);
    const seIds = f.data.officialSources
      .map((s) => /\b([Ss][Et]-\d{3,4})\b/.exec(s.label)?.[1])
      .filter(Boolean)
      .join(' ');
    entries.push({
      slug: f.id,
      id: f.data.id,
      title: f.data.title,
      introduced: f.data.introduced,
      text: [f.data.summary, seIds, headings.filter((h) => h.depth <= 3).map((h) => h.text).join(' ')].join(' '),
    });
  }
  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
