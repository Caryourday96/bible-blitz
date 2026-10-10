/** Only letters and digits are significant; the same normalization is used everywhere. */
export function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/Æ/g, 'AE')
    .replace(/Œ/g, 'OE')
    .replace(/[^A-Z0-9]/g, '');
}

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Multiword answers are flattened; digits are preserved as tiles too. */
export function scramble(answer: string, random = Math.random): string {
  const original = normalize(answer);
  if (new Set(original).size < 2)
    throw new Error('A scramble needs at least two distinct characters.');
  for (let attempt = 0; attempt < 20; attempt++) {
    const value = shuffle([...original], random).join('');
    if (value !== original) return value;
  }
  // Guaranteed nonidentity for even a pathological RNG, with identical multiplicity.
  const chars = [...original];
  const other = chars.findIndex((c) => c !== chars[0]);
  [chars[0], chars[other]] = [chars[other], chars[0]];
  return chars.join('');
}

export function matches(input: string, answer: string, aliases: string[] = []): boolean {
  const key = normalize(input);
  return key.length > 0 && [answer, ...aliases].some((candidate) => normalize(candidate) === key);
}
