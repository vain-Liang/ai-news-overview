import assert from "node:assert/strict";
import test from "node:test";

import { fetchHomepageNews, ingestNews } from "../src/features/news/api/news-client.ts";

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

test("ingestNews sends a bearer token for jwt-authenticated requests", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      crawled_count: 3,
      metadata_stored_count: 3,
      vector_stored_count: 3,
      by_source: { xinhua: 3 },
    });
  };

  const response = await ingestNews(
    { sources: ["xinhua", "ifeng"] },
    { authMethod: "jwt", token: "jwt-token" },
  );

  assert.equal(String(calls[0]?.input), "/api/news/ingest");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    sources: ["xinhua", "ifeng"],
    bypass_cache: true,
  });
  assert.deepEqual(calls[0]?.init?.headers, {
    Accept: "application/json",
    Authorization: "Bearer jwt-token",
    "Content-Type": "application/json",
  });
  assert.equal(response.crawled_count, 3);
});

test("ingestNews uses cookie credentials for cookie-authenticated requests", async () => {
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return createJsonResponse({
      crawled_count: 2,
      metadata_stored_count: 2,
      vector_stored_count: 2,
      by_source: { qqnews: 2 },
    });
  };

  await ingestNews(
    { sources: ["qqnews"], bypassCache: false },
    { authMethod: "cookie", token: null },
  );

  assert.equal(String(calls[0]?.input), "/api/news/ingest");
  assert.equal(calls[0]?.init?.credentials, "include");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    sources: ["qqnews"],
    bypass_cache: false,
  });
});
