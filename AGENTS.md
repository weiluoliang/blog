# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + Vue 3 + TypeScript static blog. Application code lives in `src/`: `main.ts` mounts the app, `App.vue` contains the main UI, `content.ts` loads and parses Markdown, and `styles.css` holds global styling. Blog posts are Markdown files under `content/<category>/`, where each category is represented by a folder. Public static assets belong in `public/`, such as `public/logo.jpg`. Production output is generated into `dist/` and should not be edited by hand.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server on all interfaces.
- `npm run build`: run `vue-tsc --noEmit` type checks, then build static files with Vite.
- `npm run preview`: serve the built `dist/` output locally for verification.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use TypeScript with strict settings as configured in `tsconfig.json`. Follow the existing style: two-space indentation in Vue/CSS blocks, single quotes in TypeScript imports and strings, and semicolons. Name Vue components in PascalCase, TypeScript interfaces in PascalCase, functions and variables in camelCase, and content files with descriptive Markdown names. Keep category folder names stable because they are used to organize and display articles.

## Content Guidelines

Place new posts in `content/<category>/<article-title>.md`. Include frontmatter when adding articles:

```md
---
title: Article title
description: Short summary
date: 2026-07-11
tags: [Vue, Markdown]
order: 1
---
```

Avoid raw HTML in Markdown unless the renderer is intentionally updated to support it.

## Testing Guidelines

No automated test script is currently configured. Before opening a change, run `npm run build` to validate TypeScript and bundling. For UI or content changes, also run `npm run dev` or `npm run preview` and inspect navigation, article rendering, headings, and asset loading in the browser.

## Commit & Pull Request Guidelines

This repository has no committed history yet, so use clear imperative commit messages such as `Add article metadata parsing` or `Update blog layout`. Pull requests should include a short summary, manual verification steps, linked issues when applicable, and screenshots for visible UI changes. Keep generated files like `dist/` out of reviews unless deployment explicitly requires them.
