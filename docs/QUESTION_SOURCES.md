# Question bank sources and editorial policy

The bank contains biblical proper names, geographic names and titles of the 66 books common to Protestant Bibles; it is not a denominational canon comparison. Entries can belong to multiple categories but are deduplicated by normalized answer. First record sets curated difficulty; difficulty is an editorial estimate.

Names were checked against public-domain King James Bible text and standard modern spelling variants. Source text: https://github.com/thiagobodruk/bible/blob/master/json/en_kjv.json . Books use the conventional English table of contents. Modern labels such as Dead Sea and modern transliterations are recorded as such in validation notes.

No verse quotations, unverified facts, or speculative verse references are included. Optional fact/reference fields are deliberately absent rather than invented. Aliases include Rebecca/Rebekah, Aholiab/Oholiab, Pergamos/Pergamum, and normalized punctuation. Numbered book titles accept Arabic, Roman and spelled-out ordinals. Multiword names are flattened into tiles, including digits.

Unit tests validate IDs, canonical-answer uniqueness, required categories, difficulty values, letter multiplicities, aliases, and nonidentity for every entry. A random new scramble and nonrepeating deck are generated per session.

## Source check, 2026-10-10

`npx tsx scripts/verify-source.ts path/to/en_kjv.json` checked 336 entries. All non-book names or their accepted spelling variants occur in the normalized source (zero unmatched). Source SHA-256: `fc99486e7d3b86e4ad1f0f424b36ab41b4ec4db858a776bd13aee1b7910f136b`.

This is an occurrence check, not a theological or historical claim. No source verses were copied into the game. Modern Dead Sea accepts the KJV name Salt Sea. Ligatures, diacritics and KJV/modern spelling variants are normalized or recorded explicitly.
