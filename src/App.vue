<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { articles, categories, type Article } from './content';

type Route =
  | { name: 'home' }
  | { name: 'category'; categorySlug: string }
  | { name: 'article'; categorySlug: string; articleSlug: string };

interface SearchEntry {
  article: Article;
  title: string;
  description: string;
  category: string;
  tags: string;
  body: string;
  all: string;
}

interface SearchResult {
  article: Article;
  excerpt: string;
  score: number;
}

const route = ref<Route>(parseRoute());
const keyword = ref('');

const searchEntries: SearchEntry[] = articles.map((article) => {
  const title = normalizeSearchText(article.title);
  const description = normalizeSearchText(article.description);
  const category = normalizeSearchText(article.category);
  const tags = normalizeSearchText(article.tags.join(' '));
  const body = normalizeSearchText(article.body);

  return {
    article,
    title,
    description,
    category,
    tags,
    body,
    all: [title, description, category, tags, body].join(' '),
  };
});

const searchText = computed(() => keyword.value.trim());
const searchTerms = computed(() =>
  normalizeSearchText(searchText.value)
    .split(/\s+/)
    .filter(Boolean),
);
const isSearching = computed(() => searchTerms.value.length > 0);

const activeCategory = computed(() => {
  const currentRoute = route.value;

  if (currentRoute.name !== 'category' && currentRoute.name !== 'article') {
    return undefined;
  }

  return categories.find((category) => category.slug === currentRoute.categorySlug);
});

const activeArticle = computed(() => {
  const currentRoute = route.value;

  if (currentRoute.name !== 'article') {
    return undefined;
  }

  return articles.find(
    (article) =>
      article.categorySlug === currentRoute.categorySlug && article.slug === currentRoute.articleSlug,
  );
});

const currentCategory = computed(() => activeCategory.value ?? categories[0]);

const moduleCards = computed(() =>
  categories.map((category) => ({
    ...category,
    description: category.description,
    tags: Array.from(new Set(category.articles.flatMap((article) => article.tags))).slice(0, 5),
  })),
);

const searchResults = computed<SearchResult[]>(() => {
  const terms = searchTerms.value;

  if (!terms.length) {
    return [];
  }

  return searchEntries
    .map((entry) => {
      if (!terms.every((term) => entry.all.includes(term))) {
        return undefined;
      }

      return {
        article: entry.article,
        excerpt: createSearchExcerpt(entry.article, terms),
        score: getSearchScore(entry, terms),
      };
    })
    .filter((result): result is SearchResult => Boolean(result))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return b.article.date.localeCompare(a.article.date);
    });
});

const visibleArticles = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  const scopedArticles = currentCategory.value?.articles ?? [];

  if (!text) {
    return scopedArticles;
  }

  return scopedArticles.filter((article) => {
    const haystack = [
      article.title,
      article.description,
      article.category,
      article.tags.join(' '),
      article.body,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(text);
  });
});

function clearSearch() {
  keyword.value = '';
}

function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [name, categorySlug, articleSlug] = hash
    .split('/')
    .map((segment) => decodeURIComponent(segment).toLowerCase());

  if (name === 'category' && categorySlug) {
    return { name, categorySlug };
  }

  if (name === 'article' && categorySlug && articleSlug) {
    return { name, categorySlug, articleSlug };
  }

  return { name: 'home' };
}

function handleRouteChange() {
  route.value = parseRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  clearSearch();
  window.location.hash = '/';
}

function goToCategory(categorySlug: string) {
  clearSearch();
  window.location.hash = `/category/${categorySlug}`;
}

function goToArticle(article: Article) {
  clearSearch();
  window.location.hash = `/article/${article.categorySlug}/${article.slug}`;
}

function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getSearchScore(entry: SearchEntry, terms: string[]): number {
  return terms.reduce((score, term) => {
    if (entry.title.includes(term)) {
      score += 16;
    }

    if (entry.tags.includes(term)) {
      score += 8;
    }

    if (entry.category.includes(term)) {
      score += 6;
    }

    if (entry.description.includes(term)) {
      score += 4;
    }

    if (entry.body.includes(term)) {
      score += 1;
    }

    return score;
  }, 0);
}

function createSearchExcerpt(article: Article, terms: string[]): string {
  const plainText = [article.description, article.body]
    .join(' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedText = normalizeSearchText(plainText);
  const firstMatchIndex =
    terms
      .map((term) => normalizedText.indexOf(term))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstMatchIndex - 56);
  const end = Math.min(plainText.length, start + 150);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < plainText.length ? '...' : '';

  return `${prefix}${plainText.slice(start, end)}${suffix}`;
}

onMounted(() => {
  window.addEventListener('hashchange', handleRouteChange);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', handleRouteChange);
});
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <button class="brand" type="button" @click="goHome">
        <img class="brand-mark" src="/logo.jpg" alt="luoliang 的学习笔记 logo" />
        <span>
          <strong>luoliang 的学习笔记</strong>
        </span>
      </button>

      <nav class="nav-links" aria-label="主导航">
        <a
          v-for="category in categories"
          :key="category.slug"
          :class="{ active: route.name !== 'home' && currentCategory?.slug === category.slug }"
          :href="`#/category/${category.slug}`"
          @click="clearSearch"
        >
          {{ category.name }}
        </a>
      </nav>

      <label class="nav-search" for="site-search">
        <span>搜索</span>
        <input
          id="site-search"
          v-model="keyword"
          type="search"
          placeholder="搜索文章"
        />
      </label>
    </header>

    <main v-if="isSearching" class="search-page">
      <section class="page-head">
        <p class="eyebrow">全站搜索</p>
        <h1>搜索 “{{ searchText }}”</h1>
        <p>找到 {{ searchResults.length }} 篇相关文章。</p>
      </section>

      <section v-if="searchResults.length" class="article-list search-results">
        <article v-for="result in searchResults" :key="result.article.id" class="article-card">
          <button type="button" @click="goToArticle(result.article)">
            <span class="article-meta">
              {{ result.article.category }} · {{ result.article.date }} ·
              {{ result.article.readingMinutes }} 分钟
            </span>
            <h2>{{ result.article.title }}</h2>
            <p>{{ result.excerpt }}</p>
            <span class="tag-row">
              <small v-for="tag in result.article.tags" :key="tag">{{ tag }}</small>
            </span>
          </button>
        </article>
      </section>

      <section v-else class="empty-state">
        <h2>没有匹配的文章</h2>
        <p>换个关键词试试，比如数据库、RAG、Docker 或 API。</p>
      </section>
    </main>

    <main v-else-if="route.name === 'home'" class="home-page">
      <section class="home-hero">
        <h1>技术学习指南</h1>
        <p>沉淀后端、数据库、AI 与部署运维笔记，构建可检索、可复盘的技术地图。</p>
      </section>

      <section class="module-grid" aria-label="学习模块">
        <button
          v-for="(module, index) in moduleCards"
          :key="module.slug"
          class="module-card"
          :class="`theme-${index % 4}`"
          type="button"
          @click="goToCategory(module.slug)"
        >
          <span class="module-icon">{{ module.name.slice(0, 1) }}</span>
          <h2>{{ module.name }}</h2>
          <p>{{ module.description }}</p>
          <span class="module-tags">
            <small v-for="tag in module.tags" :key="tag">{{ tag }}</small>
          </span>
          <strong>查看全部 {{ module.count }} 篇</strong>
        </button>
      </section>
    </main>

    <div v-else class="layout">
      <aside class="sidebar" aria-label="文章目录">
        <nav class="doc-nav">
          <section v-if="currentCategory" class="nav-group">
            <button
              class="category-link"
              :class="{ active: activeCategory?.slug === currentCategory.slug }"
              type="button"
              @click="goToCategory(currentCategory.slug)"
            >
              <span>{{ currentCategory.name }}</span>
              <strong>{{ currentCategory.count }}</strong>
            </button>

            <button
              v-for="article in currentCategory.articles"
              :key="article.id"
              class="article-nav-link"
              :class="{ active: activeArticle?.id === article.id }"
              type="button"
              @click="goToArticle(article)"
            >
              {{ article.title }}
              </button>
          </section>
        </nav>
      </aside>

      <main class="main">
        <template v-if="route.name === 'category'">
          <section class="page-head">
            <p class="eyebrow">文章分类</p>
            <h1>{{ activeCategory?.name ?? '分类不存在' }}</h1>
            <p>这个分类下共有 {{ activeCategory?.count ?? 0 }} 篇文章。</p>
          </section>

          <section class="article-list">
            <article v-for="article in visibleArticles" :key="article.id" class="article-card">
              <button type="button" @click="goToArticle(article)">
                <span class="article-meta">{{ article.date }} · {{ article.readingMinutes }} 分钟</span>
                <h2>{{ article.title }}</h2>
                <p>{{ article.description }}</p>
                <span class="tag-row">
                  <small v-for="tag in article.tags" :key="tag">{{ tag }}</small>
                </span>
              </button>
            </article>
          </section>
        </template>

        <template v-else>
          <article v-if="activeArticle" class="article-page">
            <div class="article-head">
              <h1>{{ activeArticle.title }}</h1>
              <p>{{ activeArticle.description }}</p>
              <div class="article-facts">
                <span>{{ activeArticle.date }}</span>
                <span>{{ activeArticle.readingMinutes }} 分钟阅读</span>
                <span>{{ activeArticle.category }}</span>
              </div>
            </div>

            <div class="article-layout">
              <div class="markdown-body" v-html="activeArticle.html"></div>

              <aside v-if="activeArticle.headings.length" class="toc" aria-label="文章目录">
                <p>目录</p>
                <button
                  v-for="heading in activeArticle.headings"
                  :key="`${heading.id}-${heading.text}`"
                  :class="`level-${heading.level}`"
                  type="button"
                  @click="scrollToHeading(heading.id)"
                >
                  {{ heading.text }}
                </button>
              </aside>
            </div>
          </article>

          <section v-else class="page-head">
            <p class="eyebrow">404</p>
            <h1>文章没有找到</h1>
            <p>请从左侧分类或首页重新进入。</p>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>
