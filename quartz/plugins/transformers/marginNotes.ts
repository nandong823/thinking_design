import { QuartzTransformerPlugin } from "../types"
import { Root, Parent, Paragraph } from "mdast"
import { visit } from "unist-util-visit"

interface Options {
  enabled: boolean
}

const defaultOptions: Options = {
  enabled: true,
}

export const MarginNotes: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "MarginNotes",
    markdownPlugins() {
      if (!opts.enabled) return []

      return [
        () => {
          return (tree: Root) => {
            const nodesToTransform: Array<{ parent: Parent; index: number; node: Paragraph }> = []

            // Find all paragraphs that start with :::{.margin}
            visit(tree, "paragraph", (node: Paragraph, index: number | undefined, parent: Parent | undefined) => {
              if (!parent || index === undefined) return

              const firstChild = node.children[0]
              if (
                firstChild &&
                firstChild.type === "text" &&
                firstChild.value.startsWith(":::{.margin}")
              ) {
                nodesToTransform.push({ parent, index, node })
              }
            })

            // Process in reverse to maintain correct indices
            for (let i = nodesToTransform.length - 1; i >= 0; i--) {
              const { parent, index, node } = nodesToTransform[i]

              // Collect all content until we find :::
              const contentNodes = []
              let endIndex = index
              let foundEnd = false

              // Check if the opening marker and closing marker are in the same paragraph
              const firstChild = node.children[0]
              if (firstChild && firstChild.type === "text") {
                const text = firstChild.value
                const closeMarkerIndex = text.indexOf(":::", 12) // Start searching after :::{.margin}

                if (closeMarkerIndex !== -1) {
                  // Single paragraph margin note
                  const content = text.substring(12, closeMarkerIndex).trim()
                  if (content) {
                    const marginNote = {
                      type: "html" as const,
                      value: `<aside class="margin-note" data-margin-note>${content}</aside>`,
                    }
                    parent.children[index] = marginNote
                  } else {
                    // Empty margin note, remove it
                    parent.children.splice(index, 1)
                  }
                  continue
                }
              }

              // Multi-paragraph margin note
              // Remove the opening marker
              if (firstChild && firstChild.type === "text") {
                firstChild.value = firstChild.value.substring(12).trim()
              }

              contentNodes.push(node)

              // Look for closing :::
              for (let j = index + 1; j < parent.children.length; j++) {
                const sibling = parent.children[j]

                if (sibling.type === "paragraph") {
                  const lastChild = sibling.children[sibling.children.length - 1]
                  if (lastChild && lastChild.type === "text" && lastChild.value.includes(":::")) {
                    // Found the closing marker
                    foundEnd = true
                    endIndex = j

                    // Remove the closing marker
                    const closingText = lastChild.value
                    const markerPos = closingText.indexOf(":::")
                    if (markerPos === 0) {
                      // The whole paragraph is just :::
                      sibling.children.pop()
                      if (sibling.children.length === 0) {
                        // Remove empty paragraph
                        break
                      }
                    } else {
                      lastChild.value = closingText.substring(0, markerPos).trim()
                    }

                    if (sibling.children.length > 0) {
                      contentNodes.push(sibling)
                    }
                    break
                  }
                }

                contentNodes.push(sibling)
              }

              if (foundEnd) {
                // Convert content to HTML
                // For now, we'll use a simple approach - wrap in aside
                const marginNote = {
                  type: "html" as const,
                  value: `<aside class="margin-note" data-margin-note><div class="margin-note-content">`,
                }

                const marginNoteEnd = {
                  type: "html" as const,
                  value: `</div></aside>`,
                }

                // Replace the range with margin note wrapper
                parent.children.splice(index, endIndex - index + 1, marginNote, ...contentNodes, marginNoteEnd)
              }
            }
          }
        },
      ]
    },
  }
}
