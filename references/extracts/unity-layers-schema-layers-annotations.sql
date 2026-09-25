CREATE TABLE IF NOT EXISTS layers (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tags (
    id       INTEGER PRIMARY KEY,
    layer_id INTEGER NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    UNIQUE (layer_id, name)
);

CREATE TABLE IF NOT EXISTS file_tags (
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, tag_id)
);

-- Extracted text, analysed (app/index/analyze.py) and zlib'd. Since docs_fts
-- below is contentless, this is the ONLY place the characters themselves
-- live: snippets, the graph's tokenizer, and any future re-index all read
-- from here. Storing the analysed form rather than the raw means highlight
-- offsets line up with what was indexed, and the original is always still in
-- the PDF if it is ever wanted.
CREATE TABLE IF NOT EXISTS doc_text (
CREATE TABLE IF NOT EXISTS annotations (
    id         INTEGER PRIMARY KEY,
    file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    quick_hash TEXT,               -- portable identity once extraction has run
    page       INTEGER NOT NULL,
    x          REAL NOT NULL,
    y          REAL NOT NULL,
    -- How to read x/y. 'point' is a pin, the original v1 shape. 'page' is a
    -- note about a page with no position, written x=y=0 — the fast-capture
    -- case, because asking *where exactly* at the moment a reader is holding a
    -- thought is the wrong question. 'span' will carry start_char/end_char into
    -- doc_text instead of coordinates, since Stage 2 already stores per-page
    -- character offsets and a character range survives zoom and re-render in a
    -- way a rectangle does not.
    --
    -- A column rather than nullable x/y: those are NOT NULL, and SQLite cannot
    -- relax that without rebuilding the table, which is the destructive
    -- migration STATUS.md forbids while two worktrees share one overlay.
    anchor     TEXT NOT NULL DEFAULT 'point',
    layer_id   INTEGER REFERENCES layers(id) ON DELETE SET NULL,
    body       TEXT NOT NULL DEFAULT '',   -- markdown
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_annotations_file ON annotations(file_id, page);

-- File-to-file relationship graph (discovery layer, complementary to search
-- — see the graph design discussion). One row per (pair, edge_type); a pair
-- can hold multiple edge_type rows if more than one signal connects them.
-- file_a < file_b always, enforced at write time, so a pair is never stored
-- twice under the same type. weight is 0..1 and comparable within a type,
-- NOT across types (a 0.8 shared_tag and a 0.8 text_similarity are not the
-- same strength of evidence).
