import { request } from "../../../shared/api/http.ts";

import type { HomepageNewsResponse } from "../model";

export const fetchHomepageNews = (perSource = 8) =>
  request<HomepageNewsResponse>(`/news/homepage?per_source=${perSource}`);
