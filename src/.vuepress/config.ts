import { defineUserConfig } from "vuepress";
import { searchProPlugin } from "vuepress-plugin-search-pro";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  locales: {
    "/": {
      lang: "en-US",
      title: "luoliang",
      description: "这是博客描述",
    }
  },

  theme,

  shouldPrefetch: false,

  plugins: [
      searchProPlugin({
        // 索引全部内容
        indexContent: true,
        // 为分类和标签添加索引
        customFields: [
          {
            getter: (page) => page.frontmatter.category,
            formatter: "分类：$content",
          },
          {
            getter: (page) => page.frontmatter.tag,
            formatter: "标签：$content",
          },
        ],
      }),
    ],
});
