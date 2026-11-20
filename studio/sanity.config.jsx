import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes/index.js';
import { structure } from './structure.js';
import { resolveActions, resolveBadges } from './workflow/actions.jsx';
import { RtlLayout } from './workflow/RtlLayout.jsx';

export default defineConfig({
  name: 'axiom',
  title: 'AXIOM+: غرفة التحرير',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure, title: 'المحتوى' }), visionTool({ title: 'استعلام' })],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'article-kind',
        title: 'مادّة جديدة',
        schemaType: 'article',
        parameters: [{ name: 'kind', type: 'string' }],
        value: ({ kind }) => ({ kind, workflow: 'draft' }),
      },
    ],
  },
  document: {
    actions: resolveActions,
    badges: resolveBadges,
    // إعدادات الموقع وثيقة واحدة لا تُكرَّر
    newDocumentOptions: (prev) => prev.filter((t) => t.templateId !== 'siteSettings'),
  },
  studio: { components: { layout: RtlLayout } },
});
