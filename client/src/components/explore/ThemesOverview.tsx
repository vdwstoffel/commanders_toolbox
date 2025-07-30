import { useGetThemesOverview } from "@/hooks/useExploreQuery";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import ThemeCard from "./ThemeCard";
import { useNavigate } from "react-router-dom";

export default function ThemesOverview() {
  const { isPendingThemesOverview, themesOverviewError, themesOverview } = useGetThemesOverview();
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
