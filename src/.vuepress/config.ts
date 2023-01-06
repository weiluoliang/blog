import { defineUserConfig } from "vuepress";
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
});
