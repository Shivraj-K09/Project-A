/**
 * REWRITTEN Search Utility - Ultra-Strict Prefix Matching
 * No fuzzy slop, no acronyms, no regex. Instant results only.
 */

export interface SearchMatch {
  indices: [number, number][]; // [start, end] pairs
  score: number;
}

export interface SearchResult<T> {
  item: T;
  match?: SearchMatch;
}

export function smartSearch<T extends { name: string }>(items: T[], query: string): SearchResult<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.map((item) => ({ item }));

  const results: SearchResult<T>[] = [];
  const qLen = q.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.name;
    const lowerName = name.toLowerCase();
    
    // 1. Full Name Prefix (Highest Score: 1000)
    if (lowerName.startsWith(q)) {
      results.push({ item, match: { score: 1000, indices: [[0, qLen]] } });
      continue;
    }

    // 2. Individual Word Prefix (High Score: 800)
    const words = name.split(' ');
    let wordStart = 0;
    let wordMatched = false;
    
    for (let j = 0; j < words.length; j++) {
      const word = words[j];
      const lowerWord = word.toLowerCase();
      if (lowerWord && lowerWord.startsWith(q)) {
        results.push({ item, match: { score: 800 - j, indices: [[wordStart, wordStart + qLen]] } });
        wordMatched = true;
        break;
      }
      wordStart += word.length + 1;
    }

    if (wordMatched) continue;

    // 3. Acronym/Initialism Matching (Smart Score: 600)
    // Example: "SK" matches "Shivraj Kadgond"
    if (qLen >= 2 && qLen <= words.filter(w => w.length > 0).length) {
      const acronymIndices: [number, number][] = [];
      let currentWordStart = 0;
      let matchedChars = 0;

      for (let j = 0; j < words.length && matchedChars < qLen; j++) {
        const word = words[j];
        if (word.length > 0) {
          if (word[0].toLowerCase() === q[matchedChars]) {
            acronymIndices.push([currentWordStart, currentWordStart + 1]);
            matchedChars++;
          }
        }
        currentWordStart += word.length + 1;
      }

      if (matchedChars === qLen) {
        results.push({ item, match: { score: 600, indices: acronymIndices } });
      }
    }
  }

  // Sort by score (descending)
  return results.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
}
