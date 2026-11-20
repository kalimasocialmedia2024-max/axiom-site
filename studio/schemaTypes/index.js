import { blockContent } from './blockContent.js';
import { article } from './article.js';
import { writer } from './writer.js';
import { program, episode } from './media.js';
import { page, siteSettings } from './site.js';

export const schemaTypes = [article, writer, episode, program, page, siteSettings, blockContent];
