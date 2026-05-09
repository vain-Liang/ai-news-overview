import { request } from "../../../shared/api/http.ts";

import type {
  HomepageNewsResponse,
  NewsIngestResponse,
  NewsSearchResponse,
  NewsSourceCode,
  NewsSummarizeResponse,
} from "../model";

export const fetchHomepageNews = (perSource = 8) =>
  request<HomepageNewsResponse>(`/news/homepage?per_source=${perSource}`);

export const ingestNews = (payload: {
  sources: NewsSourceCode[];
  bypassCache?: boolean;
}) =>
  request<NewsIngestResponse>("/news/ingest", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sources: payload.sources,
      bypass_cache: payload.bypassCache ?? true,
    }),
  });

export const searchNews = (params: {
  query: string;
  nResults?: number;
  source?: string;
}) => {
  const searchParams = new URLSearchParams({ query: params.query });
  if (params.nResults !== undefined) {
    searchParams.set("n_results", String(params.nResults));
  }
  if (params.source) {
    searchParams.set("source", params.source);
  }
  return request<NewsSearchResponse>(`/news/search?${searchParams.toString()}`);
};

export const summarizeNews = (payload: {
  query: string;
  nResults?: number;
  source?: NewsSourceCode | null;
}) =>
  request<NewsSummarizeResponse>("/news/summarize", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: payload.query,
      n_results: payload.nResults ?? 6,
      source: payload.source ?? null,
    }),
  });
