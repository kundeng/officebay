# Handwriting — source excerpts quoted by the layer-anchoring research

Quoted for analysis, with attribution, from `github.com/ellimist-afk/handwriting`
@ `fbc81280b6252ddc9c2799fe9e85ce56351a6472` (v1.4.19, 2026-09-14).
Copyright (c) 2026 Alan Liu. Licensed CC BY-NC-ND 4.0 — see `handwriting-LICENSE.txt`.

These are excerpts, not a copy of the program. They exist so the claims in
`docs/research/2026-09-17-markdown-block-model-and-layer-anchoring.md` are checkable
from inside this repo. Line numbers are against the pinned commit.

## `src/model/PageData.ts` — the surface / coordSpace / slides fields

```typescript
	z: number;
}

export interface PageData {
	schemaVersion: number;
	pageId: string;
	/**
	 * Which coordinate world the geometry lives in. `"inline"` = note-surface
	 * coordinates over the ordinary Markdown editor (origin at the content
	 * column's top-left). Absent = a legacy canvas page (free world space).
	 * The two must never be confused: the inline layer refuses to render or
	 * overwrite a canvas sidecar, and vice-versa nothing reinterprets legacy
	 * geometry until it is deliberately migrated.
	 */
	surface?: "inline" | "pdf" | "slides";
	/**
	 * Which coordinate convention the geometry is written in, for surfaces
	 * where that could ever change. `"page-css@1"` = page-local css px at
	 * scale 1.0, top-left origin of the page div.
	 *
	 * Written so a future migration is VERSIONED rather than guessed. If a
	 * later build needs PDF user units (rotation support is the likely
	 * reason), it can tell which convention a file was written in instead of
	 * inferring it from the numbers - and inferring it from the numbers is
	 * not possible, because both conventions produce plausible coordinates.
	 */
	coordSpace?: string;
	/**
	 * PDF sidecars only: the vault paths this sidecar believes it belongs
	 * to. Stored IN the sidecar so replicas agree by sync rather than
	 * coordination - this is what lets two byte-identical PDFs be different
	 * INSTANCES of one content family (a fresh copy starts blank) while a
	 * renamed file keeps its ink. Absent = pre-instance data, adopted by
	 * the first opener. See PdfIdentity.chooseInstance.
	 */
	pdfPaths?: string[];
	/**
	 * Slides sidecars only: the LOGICAL deck size the ink was drawn against
	 * (Reveal's `.slides` client box, 960x700 by default).
	 *
	 * Stored because the geometry is meaningless without it. A theme that
	 * declares a different deck size, or a future Reveal default, would
	 * otherwise reinterpret every stored coordinate silently; with the size
	 * on the file a later build can tell "these numbers were written against
	 * a 960x700 deck" apart from "these numbers are wrong".
	 */
	deck?: { width: number; height: number };
	/**
	 * Slides sidecars only: which slide each `page` index meant when the ink
	 * was written, by a hash of that section's source text.
	 *
	 * The index alone is not an identity - inserting one `---` above the
	 * first slide shifts every later index by one - so the hash is what lets
	 * a load re-attach stored ink to the section it was drawn on. Never used
	 * to DELETE ink: a section whose hash no longer matches anything keeps
	 * its index (see SlidesInkSurface.remapSlides).
	 */
	slides?: { index: number; hash: string }[];
	textBoxes: TextBoxData[];
	images: ImageData[];
	strokes: InkStroke[];
	/**
	 * Fields written by a different (probably newer) Handwriting that this version
	 * does not understand, preserved verbatim so a round-trip never destroys
	 * them. Without this, an older plugin silently deletes a newer plugin's
	 * data the first time it saves, and in a synced vault both versions are
	 * live at once.
```

## `src/inline/DocumentTop.ts:1-40` — what inline ink is anchored to

```typescript
/**
 * Where note space starts on the screen VERTICALLY: the top of the document,
 * as the text is actually laid out - which is not always the number
 * CodeMirror will tell you.
 *
 * `ContentOrigin.ts` is this file's other half. Ink is anchored to exactly
 * two numbers (`UnsettledDocumentTop.test.ts` derives the identity through
 * the real router and the real `syncCamera`): the text column's left edge,
 * which that file answers, and the document top, which is this one.
 *
 *     world.y = (clientY - documentTop) / scale
 *
 * CODEMIRROR'S ANSWER, AND WHEN IT IS WRONG. `view.documentTop` is one sum
 * (@codemirror/view/dist/index.js:8036-8037):
 *
 *     contentDOM.getBoundingClientRect().top + viewState.paddingTop
 *
 * The rect is read live and is always current. `viewState.paddingTop` is a
 * BELIEF: it is 0 from construction (:5929) and stays 0 until the first
 * measure cycle writes `(parseInt(getComputedStyle(contentDOM).paddingTop) ||
 * 0) * scaleY` into it (:6065-6070). That cycle is reached only from the rAF
 * the constructor requests (:7617, and again after `document.fonts.ready` at
 * :7619), so between construction and the next frame CodeMirror reports a
 * document top that is short by the whole top padding.
 *
 * THE CSS PADDING IS IN FORCE THE WHOLE TIME. Only the number is late. So
 * during that window the text sits `padding` px lower than CodeMirror says
 * the document does, and a stroke stored against `documentTop` is stored
 * that far off the line it was drawn on - permanently, because the store is
 * what persists. Measured on a real editor in
 * `test/render/UnsettledTopMechanisms.test.ts` (mechanism P): with Minimal's
 * 8px top padding the belief is 0 while the stylesheet already says 8, one
 * frame later `documentTop` has moved by exactly 8, and the `.cm-line` has
 * not moved at all.
 *
 * WHAT THIS IS NOT FOR, and the distinction is the whole reason the fix is
 * shaped this way. When something ABOVE `.cm-content` in the scroller grows -
 * Obsidian's inline title, its properties block, a font swap - the RECT term
 * moves, and `.cm-content` and every line inside it move by the same amount.
 * A stroke stored before that is still at the right offset from its line and
```

## `src/slides/SlidesInkSurface.ts:1-60` — presenter mount and coordinate mapping (S1-S5)

```typescript
import { timerHost } from "../util/RuntimeScheduler";
/**
 * Slides ink: the pen writes on Obsidian's core Slides presentation, and the
 * ink is still there the next time the note is presented.
 *
 * This file replaces `SlidesInkProbe.ts`. Everything the probe learned on
 * Alan's screen is carried over unchanged and is NOT re-litigated here - the
 * mount signal, the coordinate mapping, the stroke session reducer and the
 * gesture guard are the probe's, verified on hardware 2026-09-05. What is new
 * is persistence, slide identity, the wet/committed split, and the tap rule.
 * The findings are restated in short because a later reader will change this
 * file and not the deleted one:
 *
 * S1  The presenter is `div.slides-container` appended to `<body>`, not a
 *     workspace view and not a leaf. NO WORKSPACE EVENT FIRES for it. A
 *     MutationObserver on `body` (childList) is the only mount/unmount signal
 *     there is, and teardown is the container being detached.
 *
 * S2  `.reveal > .slides > section`, one section per `---`, created up front
 *     and never re-created. The current one carries the class `present`;
 *     `data-index-h` is not written (Obsidian builds the deck with
 *     `overview:false`), so the index is the section's position among the
 *     direct children of `.slides`.
 *
 * S3  `.slides` is laid out at the LOGICAL deck size (960x700 by default) and
 *     then scaled: `k = slidesRect.width / slides.clientWidth`, measured off
 *     the element rather than read from `--slide-scale`, because
 *     `getBoundingClientRect` is post-transform and `clientWidth` is not.
 *
 * S4  NEVER `stopPropagation()` a PEN or MOUSE pointerdown. Reveal's focus
 *     plugin takes the deck's focus from it and the keyboard dies without it.
 *     `preventDefault` is fine; it does not stop propagation. That half is
 *     unconditional and still exactly true.
 *
 *     A TOUCH pointerdown is the one exception (`PEN_CONTACT_GUARDED_EVENTS`),
 *     and this rule used to say the exception was "while the pen is already
 *     down", justified by "the pen's own pointerdown bubbled first and already
 *     kept the focus, so the palm's has none left to take away". AMENDED
 *     2026-09-05 (the palm work): that window left three real palms
 *     unguarded - one planted BEFORE the nib lands, one still lingering just
 *     after it lifts, and one with no pen in the room at all - so the window
 *     is now pen DOWN, pen NEAR (hovering, `PEN_NEAR_TAIL_MS`),
 *     `PEN_RELEASE_TAIL_MS` after a lift, or a palm-SHAPED contact on a
 *     platform whose contact radii mean something (`palmShapedContact`,
 *     `palmRadiusTrustworthy`). The old justification only ever covered the
 *     first of those four; the reason for the other three is that a
 *     palm-shaped or pen-shadowed touch is not a gesture the presenter made,
 *     and declining to focus the deck on one costs nothing the pen, the mouse
 *     or the keyboard cannot still do - the pen's own contact focuses the
 *     deck itself (`ensureDeckFocused`).
 *
 * S5  A cancel is not a lift. Chromium reclassifies a direct-manipulation
 *     contact as a pan a few samples in and fires `pointercancel`; a handler
 *     that commits there produces a stroke that inks two centimetres and
 *     stops. `strokeSessionReducer` holds the stroke open instead, and the
 *     standing `touch-action: none` guard (InlinePenRouter's, subtree class
 *     included - Blink ORs panning back into every nested scroller) is what
 *     stops the cancel happening at all.
 *
 *     EXTENDED 2026-09-05 (silent lift): the converse also holds - A LIFT IS
```

## `src/slides/SlidesInkSurface.ts` — sectionHash and remapSlides

```typescript
 *
 * Not cryptographic and does not need to be: the only cost of a collision is
 * that two identical slides cannot be told apart, and identical slides are
 * exactly the case `remapSlides` already refuses to guess about.
 */
export function sectionHash(text: string): string {
	let h = 0x811c9dc5;
	const s = text.trim();
	for (let i = 0; i < s.length; i++) {
		h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, "0");
}

export function sectionHashes(source: string): string[] {
	return splitSlideSections(source).map(sectionHash);
}

 * Where each stored slide's ink belongs in the deck as it is NOW (§3.6).
 *
 * Returns old index -> new index for every entry that moved; an entry that did
 * not move is absent. The rules, in order:
 *
 *  - the hash still matches the section at that index: nothing moved.
 *  - exactly one section in the whole deck matches: the slide moved there.
 *    This is the case that matters - a `---` added above the first slide - and
 *    it is why an index alone was never enough.
 *  - no match, or several (a duplicated slide): KEEP THE INDEX. Ink is never
 *    deleted and never guessed onto a slide it might not belong to; a section
 *    that comes back finds its ink where it left it.
 */
export function remapSlides(
	stored: readonly StoredSlide[],
	current: readonly string[]
): Map<number, number> {
	const moved = new Map<number, number>();
	// Built once: a deck is small, but this is a load-time loop over both
	// lists and the nested scan was the shape that made it quadratic.
	const byHash = new Map<string, number[]>();
	for (let i = 0; i < current.length; i++) {
		const list = byHash.get(current[i]!);
		if (list) list.push(i);
		else byHash.set(current[i]!, [i]);
	}
	// A section that still holds its own stored slide is SPOKEN FOR, and a
	// duplicate elsewhere must not be moved on top of it.
	const settled = new Set<number>();
	for (const slide of stored) {
		if (current[slide.index] === slide.hash) settled.add(slide.index);
	}
	// Claimants per section. Two STORED slides that share a hash both used to
	// resolve to the one surviving section and their ink was merged there,
	// which is a silent loss of the distinction between them - and §3.6 never
	// merges. Only the nearest claimant moves; the rest keep their index and
	// are counted as kept, exactly like the ambiguous case below.
	const claims = new Map<number, number[]>();
	for (const slide of stored) {
		if (current[slide.index] === slide.hash) continue;
		const matches = byHash.get(slide.hash);
		if (!matches || matches.length !== 1) continue;
		const target = matches[0]!;
		if (target === slide.index || settled.has(target)) continue;
		const list = claims.get(target);
		if (list) list.push(slide.index);
		else claims.set(target, [slide.index]);
	}
	for (const [target, claimants] of claims) {
		// Nearest by index, ties to the lower index: an edit moves a slide a
		// short way far more often than a long way, and a tie has to break
```
