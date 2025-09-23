import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/realJohnDoe/kenpo-notes",
      Impressum: "https://realjohndoe.github.io/kenpo-notes/impressum",
    },
  }),
}

const defaultExplorer = Component.Explorer({
  filterFn: (node) => {
    // set containing names of everything you want to filter out
    const omit = new Set(["numbers/index", "single-techniques/index", "web-of-knowledge/index", "impressum"])
    return !omit.has(node.slug)
  },
  sortFn: (a, b) => {
    // if (!a.isFolder && a.slug && !b.isFolder && b.slug) {
    //   return a.slug.localeCompare(b.slug)
    // }
    // if (  !a.file && !b.file) {
    //   return a.name.localeCompare(b.name)
    // }

    // Sort order: folders first, then files. Sort folders and files alphabetically
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.slug.localeCompare(b.slug)
    }

    if (!a.isFolder && b.isFolder) {
      return 1
    } else {
      return -1
    }
  }
})

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    defaultExplorer,
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    defaultExplorer,
  ],
  right: [],
}
