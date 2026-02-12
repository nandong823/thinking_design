// Smart stacking for margin notes to prevent overlaps
function positionMarginNotes() {
  const marginNotes = Array.from(document.querySelectorAll('.margin-note')) as HTMLElement[]

  if (marginNotes.length === 0) return

  // Reset all positions first
  marginNotes.forEach(note => {
    note.style.transform = ''
  })

  // Get the position of each note relative to the document
  const notePositions = marginNotes.map(note => {
    const rect = note.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    return {
      element: note,
      top: rect.top + scrollTop,
      bottom: rect.bottom + scrollTop,
      height: rect.height,
      originalTop: rect.top + scrollTop
    }
  })

  // Sort by original position
  notePositions.sort((a, b) => a.originalTop - b.originalTop)

  // Adjust positions to prevent overlaps
  const minGap = 20 // Minimum gap between notes in pixels

  for (let i = 1; i < notePositions.length; i++) {
    const current = notePositions[i]
    const previous = notePositions[i - 1]

    // Check if current note overlaps with previous
    const previousBottom = previous.top + previous.height
    const overlap = previousBottom + minGap - current.top

    if (overlap > 0) {
      // Push current note down
      const offset = overlap
      current.top += offset
      current.bottom += offset
      current.element.style.transform = `translateY(${offset}px)`

      // Update all following notes to use this as reference
      for (let j = i + 1; j < notePositions.length; j++) {
        const next = notePositions[j]
        const currentBottom = current.top + current.height
        const nextOverlap = currentBottom + minGap - next.top

        if (nextOverlap > 0) {
          const nextOffset = nextOverlap
          next.top += nextOffset
          next.bottom += nextOffset
          const existingTransform = next.element.style.transform
          const existingOffset = existingTransform ?
            parseFloat(existingTransform.match(/translateY\(([^)]+)px\)/)?.[1] || '0') : 0
          next.element.style.transform = `translateY(${existingOffset + nextOffset}px)`
        }
      }
    }
  }
}

// Run on initial load and navigation
document.addEventListener("nav", () => {
  // Wait for content to render
  setTimeout(() => {
    positionMarginNotes()
  }, 100)

  // Reposition on window resize
  const handleResize = () => {
    positionMarginNotes()
  }

  window.addEventListener('resize', handleResize)
  window.addCleanup(() => window.removeEventListener('resize', handleResize))
})

// Also run on initial page load (before SPA navigation)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(positionMarginNotes, 100)
  })
} else {
  setTimeout(positionMarginNotes, 100)
}
