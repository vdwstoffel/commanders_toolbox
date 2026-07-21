import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useGetThemesOverview } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import ThemeCard from "./ThemeCard";

export default function ThemesOverview() {
  const { overview } = useParams();
  const { isPendingThemesOverview, themesOverviewError, themesOverview } = useGetThemesOverview(overview as "themes" | "typal");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const title = overview === "typal" ? "Typal" : "Themes";

  const filteredThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themesOverview ?? [];
    return (themesOverview ?? []).filter((theme) => theme.name.toLowerCase().includes(q));
  }, [themesOverview, query]);

  if (isPendingThemesOverview) return <Loader />;
  if (themesOverviewError) return <ErrorMessage msg={`Error loading ${title.toLowerCase()}`} />;

  function navigateTo(url: string) {
    const finalUrl = url.replace("/", "").replace("tags", "themes");
    navigate(`/explore/${finalUrl}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <h1 className="text-2xl font-bold">
          {title} <span className="text-base font-normal text-muted-foreground">({themesOverview?.length ?? 0})</span>
        </h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          aria-label={`Search ${title.toLowerCase()}`}
          className="w-full max-w-sm rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      {filteredThemes.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No matches for “{query}”.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
          {filteredThemes.map((theme) => (
            <ThemeCard key={theme.name} themeName={theme.name} onClickFn={() => navigateTo(theme.url)} />
          ))}
        </div>
      )}
    </div>
  );
}
