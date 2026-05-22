import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { searchNews } from "../api/news-client";
import { NEWS_SOURCE_ORDER } from "../lib/news-utils";
import type { NewsSearchResult, NewsSourceCode } from "../model";
import { Alert } from "../../../shared/ui/alert";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; query: string; results: NewsSearchResult[] };

const ResultCard = ({ article }: { article: NewsSearchResult }) => {
  const { t } = useTranslation(["newsSearchSection", "homepageNewsSection"]);

  return (
    <li className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-2">
      <a
        className="group inline-flex items-start gap-2 text-sm font-medium leading-6 text-foreground transition-colors hover:text-primary"
        href={article.url}
        target="_blank"
        rel="noreferrer"
      >
        <span>{article.title}</span>
        <ExternalLink className="mt-1 size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
      </a>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-xs">
          {t(`sourceLabels.${article.source}`, { ns: "homepageNewsSection", defaultValue: article.source })}
        </Badge>
        {article.distance != null ? (
          <span>
            {t("relevance")}: {(1 - article.distance).toFixed(2)}
          </span>
        ) : null}
        {article.published_at ? <span>{article.published_at}</span> : null}
      </div>
      {article.summary ? (
        <p className="text-xs leading-5 text-muted-foreground line-clamp-2">{article.summary}</p>
      ) : null}
    </li>
  );
};

export const NewsSearchSection = () => {
  const { t } = useTranslation(["newsSearchSection", "homepageNewsSection"]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceCode | null>(null);
  const [state, setState] = useState<SearchState>({ kind: "idle" });

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setState({ kind: "loading" });
    try {
      const response = await searchNews({ query: trimmed, source: source ?? undefined });
      setState({ kind: "done", query: trimmed, results: response.results });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : t("error"),
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          <Search className="size-3.5" />
          {t("badge")}
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {NEWS_SOURCE_ORDER.map((src) => (
              <Button
                key={src}
                type="button"
                variant={source === src ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSource(source === src ? null : src)}
              >
                {t(`sourceLabels.${src}`, { ns: "homepageNewsSection" })}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => void handleSearch()}
              disabled={state.kind === "loading" || !query.trim()}
            >
              <Search className="size-4" />
              {state.kind === "loading" ? "Loading…" : t("button")}
            </Button>
          </div>

          {state.kind === "error" ? <Alert variant="error">{state.message}</Alert> : null}

          {state.kind === "done" ? (
            <div className="space-y-4">
              <Badge variant="outline">
                {t("resultCount", {
                  count: state.results.length,
                  query: state.query,
                })}
              </Badge>
              {state.results.length === 0 ? (
                <Alert>{t("noResults")}</Alert>
              ) : (
                <ol className="space-y-3">
                  {state.results.map((article) => (
                    <ResultCard key={article.id} article={article} />
                  ))}
                </ol>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};
