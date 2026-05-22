import { Download, LockKeyhole, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useAuth } from "../../auth/hooks/useAuth";
import { ingestNews } from "../api/news-client";
import { NEWS_SOURCE_ORDER } from "../lib/news-utils";
import type { NewsIngestResponse, NewsSourceCode } from "../model";
import { Alert } from "../../../shared/ui/alert";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";

type NewsIngestSectionProps = {
  onIngested?: () => void;
};

const INGESTABLE_SOURCES = NEWS_SOURCE_ORDER;

export const NewsIngestSection = ({ onIngested }: NewsIngestSectionProps) => {
  const { t } = useTranslation("newsIngestSection");
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [selectedSources, setSelectedSources] = useState<NewsSourceCode[]>(INGESTABLE_SOURCES);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<NewsIngestResponse | null>(null);

  const bySourceEntries = useMemo(
    () => Object.entries(result?.by_source ?? {}).sort((left, right) => right[1] - left[1]),
    [result],
  );

  const toggleSource = (source: NewsSourceCode) => {
    setSelectedSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source],
    );
  };

  const handleIngest = async () => {
    if (selectedSources.length === 0 || !isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await ingestNews({ sources: selectedSources, bypassCache: true });
      setResult(response);
      onIngested?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          <Download className="size-3.5" />
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
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t("sourcePickerTitle")}</CardTitle>
              </div>
              <Badge variant="outline">
                {t("selectedCount", { count: selectedSources.length })}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {INGESTABLE_SOURCES.map((source) => {
                const isSelected = selectedSources.includes(source);
                return (
                  <Button
                    key={source}
                    type="button"
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleSource(source)}
                  >
                    {t(`sourceLabels.${source}`)}
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSources(INGESTABLE_SOURCES)}
              >
                {t("selectAll")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSources([])}
              >
                {t("clearAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={() => void handleIngest()}
              disabled={isLoading || selectedSources.length === 0}
            >
              <RefreshCw className={isLoading ? "animate-spin" : undefined} />
              {isLoading ? t("ingesting") : t("submit")}
            </Button>

            {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

            {result ? (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">{t("successBadge")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {t("successDescription", { count: result.crawled_count })}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("crawledCount")}</div>
                    <div className="mt-1 text-2xl font-semibold">{result.crawled_count}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("metadataStoredCount")}</div>
                    <div className="mt-1 text-2xl font-semibold">{result.metadata_stored_count}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("vectorStoredCount")}</div>
                    <div className="mt-1 text-2xl font-semibold">{result.vector_stored_count}</div>
                  </div>
                </div>

                {bySourceEntries.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t("bySourceTitle")}</div>
                    <div className="flex flex-wrap gap-2">
                      {bySourceEntries.map(([source, count]) => (
                        <Badge key={source} variant="outline">
                          {t(`sourceLabels.${source}`, { defaultValue: source })}: {count}
                        </Badge>
                      ))}
                    </div>
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
