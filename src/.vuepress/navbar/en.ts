import { navbar } from "vuepress-theme-hope";

export const enNavbar = navbar([
  "/",
  { text: "管理经济学", icon: "note", link: "/管理经济学/" },
  { text: "spring", icon: "note", link: "/spring/" },
  /*{
    text: "Posts",
    icon: "edit",
    prefix: "/posts/",
    children: [
      {
        text: "Apple",
        icon: "edit",
        prefix: "apple/",
        children: [
          { text: "Apple1", icon: "edit", link: "1" },
          { text: "Apple2", icon: "edit", link: "2" },
          "3",
          "4",
        ],
      },
      {
        text: "Banana",
        icon: "edit",
        prefix: "banana/",
        children: [
          {
            text: "Banana 1",
            icon: "edit",
            link: "1",
          },
          {
            text: "Banana 2",
            icon: "edit",
            link: "2",
          },
          "3",
          "4",
        ],
      },
      { text: "Cherry", icon: "edit", link: "cherry" },
      { text: "Dragon Fruit", icon: "edit", link: "dragonfruit" },
      "tomato",
      "strawberry",
    ],
  },*/
  {
    text: "链接",
    icon: "note",
    link: "https://theme-hope.vuejs.vuepress/",
  },
]);
