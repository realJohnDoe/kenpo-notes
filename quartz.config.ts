import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Johannes' Kenpo Notes 🥋🗒️",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "oklch(0.98 0.025 79)", //Background color of the page
          lightgray: "#af9b7c", // used for lines around search bar and next to side bar and in graph view
          gray: "#564527", // used in the search bar and for lines in graph view
          darkgray: "oklch(0.15 0.05 79)", // used for normal text
          dark: "#160700", // used for unselected links in side bar and for unselected nodes in graph view
          secondary: "#ab4e00", // orange-leaves-700, used for center of graph and for wikilink texts
          tertiary: "#3b7800", // green-trees-700, used for clicked nodes in the graph and the selected item in the side bar
          highlight: "oklch(0.95 0.025 79)", // Used as background for wikilinks
          textHighlight: "#0000ff",
        },
        darkMode: {
          light: "oklch(0.1 0.025 79)", // bg-dark from ui-colors
          lightgray: "#3b2b0d", // border-muted from ui-colors
          gray: "#c2ae8e", //text-muted from ui-colors
          darkgray: "oklch(0.96 0.05 79)", //text from ui-colors
          dark: "#ffefcd", // also text from ui-colors
          secondary: "#ecaf3c", // yellow-vineyard-400
          tertiary: "#9dc900", // yellow-vineyard-500
          highlight: "oklch(0.2 0.025 79)",
          textHighlight: "#0000ff",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
