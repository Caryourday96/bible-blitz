import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { questions } from '../src/game/questions';
import { normalize } from '../src/game/scramble';
// Optional editorial check against the public-domain KJV JSON source in docs/QUESTION_SOURCES.md.
// Pass a downloaded local copy. This script never fetches or publishes source text.
const path = process.argv[2];
if (!path) throw new Error('Usage: npx tsx scripts/verify-source.ts path/to/en_kjv.json');
const source = readFileSync(path, 'utf8');
const books = JSON.parse(source.replace(/^\uFEFF/, '')) as { chapters: string[][] }[];
const text = normalize(books.flatMap((book) => book.chapters.flat()).join(' '));
const unmatched = questions.filter(
  (q) =>
    !q.categories.includes('Books of the Bible') &&
    ![q.answer, ...q.aliases].some((a) => text.includes(normalize(a))),
);
console.log(
  JSON.stringify(
    {
      entries: questions.length,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      unmatched: unmatched.map((q) => q.answer),
    },
    null,
    2,
  ),
);
if (unmatched.length) process.exitCode = 1;
