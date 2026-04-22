export type NewsSourceCode =
  | "xinhua"
  | "thepaper"
  | "peoples"
  | "ifeng"
  | "qqnews";

export type HomepageNewsItem = {
  id: string;
  url: string;
  source: NewsSourceCode;
  title: string;
  summary: string;
  author: string;
  published_at: string;
  crawled_at: string | null;
  distance: number | null;
};

export type HomepageNewsGroup = {
  source: NewsSourceCode;
  articles: HomepageNewsItem[];
};

export type HomepageNewsResponse = {
  groups: HomepageNewsGroup[];
};

export type NewsIngestResponse = {
  crawled_count: number;
  metadata_stored_count: number;
  vector_stored_count: number;
  by_source: Record<string, number>;
};

export type NewsSearchResult = {
  id: string;
  url: string;
  source: string;
  title: string;
  summary: string;
  author: string;
  published_at: string;
  crawled_at: string | null;
  distance: number | null;
};

export type NewsSearchResponse = {
  query: string;
  results: NewsSearchResult[];
};

export type NewsSummarizeResponse = {
  query: string;
  summary: string;
  results: NewsSearchResult[];
};
