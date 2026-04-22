import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { fetchHomepageNews } from "../api/news-client";
import { sortHomepageGroups } from "../lib/news-utils";
import type { HomepageNewsGroup } from "../model";
import { Alert } from "../../../shared/ui/alert";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";

const formatTimestamp = (value: string | null, locale: string) => {
  if (!value) {
    return "";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
};

type HomepageNewsSectionProps = {
  refreshToken?: number;
};

export const HomepageNewsSection = ({ refreshToken = 0 }: HomepageNewsSectionProps) => {
  const { i18n, t } = useTranslation();
  const [groups, setGroups] = useState<HomepageNewsGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const visibleGroups = useMemo(
    () => groups.filter((group) => group.articles.length > 0),
    [groups],
  );
  const activeSourceCount = visibleGroups.length;
  const totalArticles = useMemo(
    () => visibleGroups.reduce((count, group) => count + group.articles.length, 0),
    [visibleGroups],
  );

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchHomepageNews();
      setGroups(sortHomepageGroups(response.groups));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("news.error"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNews();
  }, [loadNews, refreshToken]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Badge className="w-fit" variant="secondary">
            <Newspaper className="size-3.5" />
            {t("news.badge")}
          </Badge>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("news.title")}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("news.description")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">
            {t("news.sourceCount", { count: activeSourceCount })}
          </Badge>
          <Badge variant="outline">
            {t("news.articleCount", { count: totalArticles })}
          </Badge>
          <Button type="button" variant="outline" onClick={() => void loadNews()} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : undefined} />
            {t("news.refresh")}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Card key={index} className="min-h-72 border-dashed">
              <CardHeader>
                <CardTitle>{t("news.loading")}</CardTitle>
                <CardDescription>{t("news.loadingDescription")}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : totalArticles === 0 ? (
        <Alert>{t("news.empty")}</Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group) => (
            <Card key={group.source} className="flex h-full flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t(`news.sources.${group.source}`)}</CardTitle>
                  <Badge variant="secondary">
                    {t("news.groupCount", { count: group.articles.length })}
                  </Badge>
                </div>
                <CardDescription>{t("news.groupDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ol className="space-y-3">
                  {group.articles.map((article) => (
                    <li key={article.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <a
                        className="group inline-flex items-start gap-2 text-sm font-medium leading-6 text-foreground transition-colors hover:text-primary"
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="line-clamp-2">{article.title}</span>
                        <ExternalLink className="mt-1 size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                      </a>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {article.published_at ? (
                          <div>
                            {t("news.publishedAt")}: {article.published_at}
                          </div>
                        ) : null}
                        {article.crawled_at ? (
                          <div>
                            {t("news.crawledAt")}:{" "}
                            {formatTimestamp(article.crawled_at, i18n.resolvedLanguage || "en")}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
