import { request } from "../../../shared/api/http.ts";

import type { HomepageNewsResponse, NewsIngestResponse, NewsSourceCode } from "../model";

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
