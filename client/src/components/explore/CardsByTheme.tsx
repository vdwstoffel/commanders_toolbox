import { useGetCardsByTheme } from "@/hooks/useExploreQuery";
import { Link, useParams } from "react-router-dom";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import CardByCollectionContainer from "./CardsByCollectionContainer";

export default function CardsByTheme() {
  const { overview, theme } = useParams();
  const { isWaitingForCardsByTheme, cardsByThemeError, cardsByTheme } = useGetCardsByTheme(theme!);

  if (isWaitingForCardsByTheme) return <Loader />;
  if (cardsByThemeError) return <ErrorMessage msg={cardsByThemeError.message} />;

  const formattedTheme = theme!
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const backLabel = overview === "typal" ? "Typal" : "Themes";

  return (
    <div className="px-6 py-6">
      <Link to={`/explore/${overview}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {backLabel}
      </Link>
      <h1 className="my-4 text-center text-5xl font-bold">Top Commanders: {formattedTheme}</h1>
      <p className="mb-6 text-center text-muted-foreground">{cardsByTheme?.length ?? 0} commanders</p>
      <CardByCollectionContainer cardCollection={cardsByTheme!} />
    </div>
  );
}
