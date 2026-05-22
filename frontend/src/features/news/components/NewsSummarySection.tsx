import { ExternalLink, LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useAuth } from "../../auth/hooks/useAuth";
import { summarizeNews } from "../api/news-client";
import { NEWS_SOURCE_ORDER } from "../lib/news-utils";
import type { NewsSearchResult, NewsSourceCode, NewsSummarizeResponse } from "../model";
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

const SourceItem = ({ article, index }: { article: NewsSearchResult; index: number }) => {
  const { t } = useTranslation(["newsSummarySection", "newsSearchSection", "homepageNewsSection"]);
  return (
    <li className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {index + 1}
        </span>
        <a
          className="group inline-flex items-start gap-1.5 text-sm font-medium leading-6 text-foreground transition-colors hover:text-primary"
          href={article.url}
          target="_blank"
          rel="noreferrer"
        >
          <span>{article.title}</span>
          <ExternalLink className="mt-1 size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-7 text-xs text-muted-foreground">
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
    </li>
  );
};

export const NewsSummarySection = () => {
  const { t } = useTranslation(["newsSummarySection", "homepageNewsSection"]);
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceCode | null>(null);
  const [state, setState] = useState<SummaryState>({ kind: "idle" });

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
              >
                <Wand2 className={state.kind === "loading" ? "animate-pulse" : undefined} />
                {state.kind === "loading"
                  ? t("generating")
                  : t("generateButton")}
              </Button>
            </div>

            {state.kind === "loading" ? <Alert>{t("generating")}</Alert> : null}

            {state.kind === "error" ? <Alert variant="error">{state.message}</Alert> : null}

            {state.kind === "done" ? (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <div className="space-y-2">
                  <Badge variant="outline">"{state.data.query}"</Badge>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {state.data.summary}
                  </p>
                </div>

                {state.data.results.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {t("sourcesTitle", { count: state.data.results.length })}
                    </div>
                    <ol className="space-y-2">
                      {state.data.results.map((article, index) => (
                        <SourceItem key={article.id} article={article} index={index} />
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
};
