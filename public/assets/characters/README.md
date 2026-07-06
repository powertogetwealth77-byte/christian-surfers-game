# Character Art — 3D Hero Portraits

Drop the official 3D character concept art here using these exact filenames
(lowercase hero IDs — do NOT rename):

  zion.png  judah.png  grace.png  kai.png  selah.png
  mercy.png  samuel.png  malachi.png  david.png  esther.png

These are referenced by `src/data/characters.ts` (`image` field) as
`/assets/characters/<id>.png`.

SAFETY: until a real PNG is added, the UI automatically falls back to the
built-in SVG `CharacterAvatar` (see its `onError` handling). Missing files
never show a broken-image icon and never break layout.
