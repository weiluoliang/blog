import MarkdownIt from 'markdown-it';

export interface Heading {
  id: string;
  level: number;
  text: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  order: number;
  category: string;
  categorySlug: string;
  slug: string;
  path: string;
  readingMinutes: number;
  headings: Heading[];
  body: string;
  html: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  articles: Article[];
  description: string;
  order: number;
}

type FrontmatterValue = string | number | string[] | undefined;
type Frontmatter = Record<string, FrontmatterValue>;

const rawArticleModules = import.meta.glob('../content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const categoryConfigs: Record<string, { description: string; order: number }> = {
  AI: {
    description: '从大模型 API、Prompt、RAG 到 Agent，把 AI 能力接入真实后端系统。',
    order: 1,
  },
  数据库: {
    description: '复习关系型数据库、缓存、检索和向量数据库，支撑 AI 应用的数据底座。',
    order: 2,
  },
  后端架构: {
    description: '沉淀接口设计、服务拆分、模型网关、任务队列和系统边界等架构能力。',
    order: 3,
  },
  部署运维: {
    description: '记录 Docker、Nginx、CI/CD、日志监控和线上发布相关的工程经验。',
    order: 4,
  },
};

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

markdown.renderer.rules.heading_open = (tokens, index) => {
  const token = tokens[index];
  const title = tokens[index + 1]?.content ?? '';
  const level = Number(token.tag.slice(1));
  return `<h${level} id="${createHeadingId(title)}">`;
};

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const hrefIndex = token.attrIndex('href');

  if (hrefIndex >= 0) {
    const href = token.attrs?.[hrefIndex]?.[1] ?? '';
    if (/^https?:\/\//.test(href)) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noreferrer');
    }
  }

  return self.renderToken(tokens, index, options);
};

export const articles: Article[] = Object.entries(rawArticleModules)
  .map(([filePath, source]) => createArticle(filePath, source))
  .sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category, 'zh-CN');
    }

    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return b.date.localeCompare(a.date);
  });

export const categories: Category[] = Array.from(
  articles.reduce((map, article) => {
    const current = map.get(article.categorySlug) ?? {
      name: article.category,
      slug: article.categorySlug,
      count: 0,
      articles: [],
      description:
        categoryConfigs[article.category]?.description ??
        `${article.category} 分类下共有多篇学习笔记。`,
      order: categoryConfigs[article.category]?.order ?? 999,
    };

    current.articles.push(article);
    current.count += 1;
    map.set(article.categorySlug, current);

    return map;
  }, new Map<string, Category>()).values(),
).sort((a, b) => {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return a.name.localeCompare(b.name, 'zh-CN');
});

export const latestArticles = [...articles]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 6);

function createArticle(filePath: string, source: string): Article {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathMatch = normalizedPath.match(/\/content\/([^/]+)\/([^/]+)\.md$/);

  if (!pathMatch) {
    throw new Error(`文章路径必须符合 content/分类/文章.md：${filePath}`);
  }

  const [, rawCategory, rawSlug] = pathMatch;
  const category = decodeURIComponent(rawCategory);
  const slug = decodeURIComponent(rawSlug);
  const { frontmatter, body } = parseFrontmatter(source);
  const title = String(frontmatter.title ?? slug);
  const description = String(frontmatter.description ?? getExcerpt(body));
  const tags = normalizeTags(frontmatter.tags);
  const date = String(frontmatter.date ?? '');
  const order = Number(frontmatter.order ?? 999);
  const categorySlug = slugify(category);
  const articleSlug = slugify(slug);
  const headings = extractHeadings(body);

  return {
    id: `${categorySlug}/${articleSlug}`,
    title,
    description,
    date,
    tags,
    order,
    category,
    categorySlug,
    slug: articleSlug,
    path: `#/article/${categorySlug}/${articleSlug}`,
    readingMinutes: estimateReadingMinutes(body),
    headings,
    body,
    html: markdown.render(body),
  };
}

function parseFrontmatter(source: string): { frontmatter: Frontmatter; body: string } {
  const normalized = source.replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const endIndex = normalized.indexOf('\n---', 4);

  if (endIndex === -1) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const frontmatterBlock = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 4).trim();

  return {
    frontmatter: frontmatterBlock.split('\n').reduce<Frontmatter>((data, line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex === -1) {
        return data;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      data[key] = parseFrontmatterValue(rawValue);

      return data;
    }, {}),
    body,
  };
}

function parseFrontmatterValue(value: string): FrontmatterValue {
  const withoutQuotes = value.replace(/^["']|["']$/g, '');

  if (/^\[.*\]$/.test(value)) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return withoutQuotes;
}

function normalizeTags(tags: FrontmatterValue): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function extractHeadings(body: string): Heading[] {
  return body
    .split('\n')
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      id: createHeadingId(match[2]),
      level: match[1].length,
      text: match[2].replace(/[`*_]/g, ''),
    }));
}

function createHeadingId(text: string): string {
  return slugify(text.replace(/[`*_]/g, ''));
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled';
}

function estimateReadingMinutes(body: string): number {
  const chineseChars = body.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const englishWords = body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9_]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil((chineseChars + englishWords) / 420));
}

function getExcerpt(body: string): string {
  return body
    .replace(/^#+\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[`*_>#-]/g, '')
    .trim()
    .slice(0, 120);
}
