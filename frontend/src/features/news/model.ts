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
