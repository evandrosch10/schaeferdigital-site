import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://schaeferdigital.com.br",
  integrations: [sitemap({ filter: (pagina) => !pagina.includes("/404") })],
  build: { inlineStylesheets: "auto" },
});
