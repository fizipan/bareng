import { createCn } from "cn/config"

// Token tipografi & bayangan custom dari globals.css harus didaftarkan,
// kalau tidak `text-body` dianggap warna dan saling hapus dengan `text-kertas`.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "micro",
            "caption",
            "meta",
            "small",
            "label",
            "body",
            "title",
            "display-sm",
            "display-md",
            "hero",
            "display-lg",
            "display-xl",
          ],
        },
      ],
      shadow: [{ shadow: ["strip", "strip-dark", "toast"] }],
    },
  },
})
