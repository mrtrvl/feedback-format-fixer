# CSV Line Break Fixer

A small, private CSV repair tool for fixing embedded line breaks in comment fields. Everything runs locally in the browser; files are never uploaded.

## Use

Open `index.html` locally, or enable GitHub Pages for this repository (Settings → Pages → Deploy from a branch → `main` / root). No build step is required.

Paste CSV text or upload a `.csv` / `.tsv` file. Choose the comment column, review the cleaned preview, then copy or download the result. Quoted CSV fields and multiline comments are supported.

## Notes

- Delimiters can be auto-detected or selected manually (comma, semicolon, tab, pipe).
- Line breaks are replaced with a space by default to preserve word boundaries.
- The first row is treated as the header row.
- Only the selected column is changed.
