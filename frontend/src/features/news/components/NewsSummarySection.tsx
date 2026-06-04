import { ExternalLink, LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useAuth } from "../../auth/hooks/useAuth";
import { summarizeNews } from "../api/news-client";
import {
  extractReferenceIndices,
  parseSummaryBlocks,
  selectCitedArticles,
  type SummaryTextPart,
} from "../lib/news-summary";
import { NEWS_SOURCE_ORDER } from "../lib/news-utils";
import type { NewsSearchResult, NewsSourceCode, NewsSummarizeResponse } from "../model";
import { cn } from "../../../shared/lib/utils";
import { Alert } from "../../../shared/ui/alert";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";

type SummaryState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: NewsSummarizeResponse };

const SummaryInlineParts = ({ parts }: { parts: SummaryTextPart[] }) => (
  <>
    {parts.map((part, index) =>
      part.kind === "reference" ? (
        <sup
          key={`ref-${part.index}-${index}`}
          className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full border border-primary/25 bg-primary/8 px-1.5 py-0.5 align-super text-[10px] font-semibold leading-none text-primary"
        >
          {part.index}
        </sup>
      ) : (
        <span key={`text-${index}`}>{part.value}</span>
      ),
    )}
  </>
);

const SourceItem = ({ article, citationIndex }: { article: NewsSearchResult; citationIndex: number }) => {
  const { t } = useTranslation(["newsSummarySection", "newsSearchSection", "homepageNewsSection"]);
  return (
    <li className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
          {citationIndex}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <a
            className="group inline-flex items-start gap-1.5 text-sm font-medium leading-6 text-foreground transition-colors hover:text-primary"
            href={article.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="line-clamp-2">{article.title}</span>
            <ExternalLink className="mt-1 size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
          </a>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {t(`sourceLabels.${article.source}`, { ns: "homepageNewsSection", defaultValue: article.source })}
            </Badge>
            {article.published_at ? <span>{article.published_at}</span> : null}
            {article.distance != null ? (
              <span>
                {t("relevance", { ns: "newsSearchSection" })}: {(1 - article.distance).toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
};

export const NewsSummarySection = () => {
  const { t } = useTranslation(["newsSummarySection", "homepageNewsSection"]);
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceCode | null>(null);
  const [state, setState] = useState<SummaryState>({ kind: "idle" });
  const summaryBlocks = state.kind === "done" ? parseSummaryBlocks(state.data.summary) : [];
  const citationIndices =
    state.kind === "done" ? extractReferenceIndices(state.data.summary, state.data.results.length) : [];
  const citedArticles = state.kind === "done" ? selectCitedArticles(state.data.summary, state.data.results) : [];

  const handleGenerate = async () => {
    const trimmed = query.trim();
    if (!trimmed || !isAuthenticated) return;

    setState({ kind: "loading" });
    try {
      const response = await summarizeNews({ query: trimmed, source });
      setState({ kind: "done", data: response });
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
          <Sparkles className="size-3.5" />
          {t("badge")}
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </div>

      {isBootstrapping ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{t("sessionLoading")}</CardTitle>
          </CardHeader>
        </Card>
      ) : null}

      {!isBootstrapping && !isAuthenticated ? (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-primary" />
              <CardTitle className="text-base">{t("authRequiredTitle")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">{t("loginAction")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isBootstrapping && isAuthenticated ? (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 pt-6">
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("queryPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleGenerate();
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={state.kind === "loading" || !query.trim()}
                  className="sm:min-w-36"
                >
                  <Wand2 className={state.kind === "loading" ? "animate-pulse" : undefined} />
                  {state.kind === "loading" ? t("generating") : t("generateButton")}
                </Button>
              </div>

              {state.kind === "loading" ? <Alert>{t("generatingDescription")}</Alert> : null}

              {state.kind === "error" ? <Alert variant="error">{state.message}</Alert> : null}
            </CardContent>
          </Card>

          {state.kind === "done" ? (
            <div
              className={cn(
                "grid gap-4",
                citedArticles.length > 0 && "xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]",
              )}
            >
              <Card className="bg-[linear-gradient(180deg,rgba(59,130,246,0.05),rgba(255,255,255,0))]">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">"{state.data.query}"</Badge>
                    <Badge variant="secondary">{t("summaryLabel")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("summaryHint")}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summaryBlocks.map((block, blockIndex) =>
                    block.kind === "list" ? (
                      <ul
                        key={`block-${blockIndex}`}
                        className="space-y-3 rounded-2xl border border-border/50 bg-background/50 p-4"
                      >
                        {block.items.map((itemParts, itemIndex) => (
                          <li key={`item-${itemIndex}`} className="flex gap-3 text-sm leading-7 text-foreground">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span className="flex-1">
                              <SummaryInlineParts parts={itemParts} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={`block-${blockIndex}`}
                        className={cn(
                          "text-sm leading-8 text-foreground",
                          blockIndex === 0 && "text-[15px]",
                        )}
                      >
                        <SummaryInlineParts parts={block.parts} />
                      </p>
                    ),
                  )}
                </CardContent>
              </Card>

              {citedArticles.length > 0 ? (
                <Card>
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-base">{t("sourcesTitle", { count: citedArticles.length })}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t("citationsHint")}</p>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {citedArticles.map((article, index) => (
                        <SourceItem
                          key={article.id}
                          article={article}
                          citationIndex={citationIndices[index] ?? index + 1}
                        />
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
