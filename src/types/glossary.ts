export interface GlossaryTerm {
  term: string;
  definition: string;
  transliteration?: string;
  arabic?: string;
  category?: string;
  source?: string;
}

export interface GlossaryResponse {
  terms: GlossaryTerm[];
  total: number;
}

