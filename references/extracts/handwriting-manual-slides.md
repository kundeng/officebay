## slides

Start Obsidian's own Slides plugin on a note and the pen writes on the
presentation. Every slide keeps its own ink, there the next time you present
that note. A slide boundary is a horizontal rule on its own line with a blank
line above it, exactly as Obsidian's presenter counts slides; a `---` directly
under a single line of text is that line's heading underline, not a boundary.

The tip inks and the eraser end erases, same as everywhere else. `Eraser`
also puts the tip to work erasing on a slide, for pens without a tail end,
and a partial erase there follows the same `Stroke` / `Reticle` choice on the
eraser's own strip button that your notes already use. A pen TAP
on the arrows, or on the close button, still turns the page or closes the
presentation - only a real stroke, one that moves or that you hold down for
a moment, draws instead. Touch and mouse click and swipe the deck exactly as
they always have; only the pen inks or erases.

Ink for the presentation lives in its own file, `<page id>.slides`, beside
the note's own ink file in `.handwriting/`. Add a slide above ones you've
already drawn on, and the ink stays with its own slide instead of sliding
down to the next number. A slide it can't place - one you rewrote, or one
whose text now appears twice in the deck - keeps the slide number it was
drawn on rather than being deleted or guessed at, so after a big edit that
ink can turn up on a different slide; the console line at load says how many
slides that happened to.

Slides ink is on by default and has no settings-tab row of its own yet;
`Toggle slides ink` in the command palette is the way to turn it off, or
back on.
