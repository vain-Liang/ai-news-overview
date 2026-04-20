import assert from "node:assert/strict";
import test from "node:test";

import { fetchHomepageNews } from "../src/features/news/api/news-client.ts";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

test("fetchHomepageNews requests the homepage endpoint with per-source limit", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({ groups: [] });
  };

  const response = await fetchHomepageNews(6);

  assert.deepEqual(response, { groups: [] });
  assert.equal(String(calls[0]?.input), "/api/news/homepage?per_source=6");
});
