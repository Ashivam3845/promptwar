import { SupportedLanguage, WelfareScheme } from '@/types';
import { VERIFIED_SCHEMES } from './schemes';

// Lightweight retrieval for the chat prompt: instead of sending every scheme (in all three
// languages) on every request, pick the few that match the worker's question and send them
// compactly in the reply language only. Everything below is precomputed once per server.

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'how', 'can', 'are', 'is', 'my', 'me', 'i', 'a', 'an', 'to', 'of',
  'in', 'on', 'do', 'does', 'get', 'have', 'from', 'about', 'which', 'who', 'will', 'should', 'this', 'that',
]);

// Crude English stemming so "deducted", "deduction" and "deductions" all match "deduct".
const SUFFIXES = ['ations', 'ation', 'ions', 'ion', 'ings', 'ing', 'edly', 'ed', 'ly', 'es', 's'];

function stem(word: string): string {
  const suffix = SUFFIXES.find((s) => word.endsWith(s) && word.length - s.length >= 4);
  return suffix ? word.slice(0, -suffix.length) : word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .map(stem);
}

interface IndexedScheme {
  scheme: WelfareScheme;
  terms: Set<string>;
  context: Record<SupportedLanguage, string>;
}

const INDEX: IndexedScheme[] = VERIFIED_SCHEMES.map((scheme) => {
  const searchable = [
    scheme.name,
    scheme.category,
    scheme.jurisdiction,
    scheme.summary.en,
    scheme.summary.hi,
    scheme.summary.pa,
    ...scheme.eligibilityCriteria,
    ...scheme.verifiedBenefits,
  ].join(' ');

  const contextFor = (language: SupportedLanguage) =>
    JSON.stringify({
      name: scheme.name,
      jurisdiction: scheme.jurisdiction,
      url: scheme.officialSourceUrl,
      summary: scheme.summary[language],
      benefits: scheme.verifiedBenefits,
      eligibility: scheme.eligibilityCriteria,
      exclusions: scheme.relevantExclusions,
      steps: scheme.applicationSteps,
    });

  return {
    scheme,
    terms: new Set(tokenize(searchable)),
    context: { en: contextFor('en'), hi: contextFor('hi'), pa: contextFor('pa') },
  };
});

const INDEX_BY_ID = new Map(INDEX.map((entry) => [entry.scheme.id, entry]));

// Used when the question matches nothing specific: the broadest safety-net schemes.
const DEFAULT_SCHEME_COUNT = 2;

/** Returns up to `limit` schemes most relevant to the question, best match first. */
export function selectRelevantSchemes(question: string, limit = 3): WelfareScheme[] {
  const queryTerms = tokenize(question);
  const scored = INDEX.map((entry, position) => ({
    entry,
    position,
    score: queryTerms.reduce((acc, term) => acc + (entry.terms.has(term) ? 1 : 0), 0),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.position - b.position);

  const picked = scored.length > 0 ? scored.slice(0, limit) : INDEX.slice(0, DEFAULT_SCHEME_COUNT).map((entry, position) => ({ entry, position, score: 0 }));
  return picked.map((s) => s.entry.scheme);
}

/** Compact, single-language prompt context for the given schemes (one JSON object per line). */
export function buildSchemeContext(schemes: WelfareScheme[], language: SupportedLanguage): string {
  return schemes
    .map((s) => INDEX_BY_ID.get(s.id)?.context[language])
    .filter(Boolean)
    .join('\n');
}
