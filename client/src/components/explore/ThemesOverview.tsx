import { useNavigate, useParams } from "react-router-dom";

import { useGetThemesOverview } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import ThemeCard from "./ThemeCard";

export default function ThemesOverview() {
  const { overview } = useParams();
  const { isPendingThemesOverview, themesOverviewError, themesOverview } = useGetThemesOverview(overview as "themes" | "kindred");
  const navigate = useNavigate();

  if (isPendingThemesOverview) return <Loader />;
  if (themesOverviewError) return <ErrorMessage msg="Error loading themes" />;

  function navigateTo(url: string) {
    const finalUrl = url.replace("/", "").replace("tags", "themes");
    navigate(`/explore/${finalUrl}`);
  }

  return (
    <div className="mx-auto text-center px-10">
      <h1>Themes Overview</h1>
      <div className="grid grid-cols-10">
        {themesOverview?.map((theme) => {
          return <ThemeCard key={theme.name} themeName={theme.name} onClickFn={() => navigateTo(theme.url)} />;
        })}
      </div>
    </div>
  );
}
