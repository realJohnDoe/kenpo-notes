import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import * as ExternalPlugin from "./.quartz/plugins"
import { isFolderPath } from "./quartz/util/path"
import type { QuartzPluginData } from "./quartz/plugins/vfile"

// TS overrides for options that need callbacks. They must run before loadQuartzConfig().

// The explorer's typings omit `slug`, but its runtime FileTrieNode has it.
type WithSlug = { slug: string }

ExternalPlugin.Explorer({
  filterFn: (node) => {
    // set containing names of everything you want to filter out
    const omit = new Set([
      "numbers/index",
      "single-techniques/index",
      "web-of-knowledge/index",
      "impressum",
      // v5 lists the generated tag pages in the explorer; v4 did not
      "tags/index",
    ])
    return !omit.has((node as unknown as WithSlug).slug)
  },
  // Sort order: folders first, then files. Sort folders and files alphabetically by slug
  sortFn: (a, b) => {
    if (a.isFolder === b.isFolder) {
      return (a as unknown as WithSlug).slug.localeCompare((b as unknown as WithSlug).slug)
    }
    return a.isFolder ? -1 : 1
  },
})

// Folder and tag listings: folders first, then alphabetically by title (ignoring dates)
const byTitleFolderFirst = (f1: QuartzPluginData, f2: QuartzPluginData) => {
  const f1IsFolder = isFolderPath(f1.slug ?? "")
  const f2IsFolder = isFolderPath(f2.slug ?? "")
  if (f1IsFolder && !f2IsFolder) return -1
  if (!f1IsFolder && f2IsFolder) return 1
  const f1Title = f1.frontmatter?.title?.toLowerCase() ?? ""
  const f2Title = f2.frontmatter?.title?.toLowerCase() ?? ""
  return f1Title.localeCompare(f2Title)
}
ExternalPlugin.FolderPage({ sort: byTitleFolderFirst })
ExternalPlugin.TagPage({ sort: byTitleFolderFirst })

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
