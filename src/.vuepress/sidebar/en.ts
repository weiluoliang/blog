import { sidebar } from "vuepress-theme-hope";

export const enSidebar = sidebar({
  "/": [
    "",
    /*{
      icon: "discover",
      text: "Demo",
      prefix: "demo/",
      link: "demo/",
      children: "structure",
    },*/
    {
      text: "管理经济学",
      icon: "note",
      prefix: "管理经济学/",
      children: "structure",
    },
    // "intro",
    // "slides",
  ],
});
