// @ts-ignore
import marginNotesScript from "./scripts/marginNotes.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const MarginNotes: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return <>{children}</>
}

MarginNotes.afterDOMLoaded = marginNotesScript

export default (() => MarginNotes) satisfies QuartzComponentConstructor
