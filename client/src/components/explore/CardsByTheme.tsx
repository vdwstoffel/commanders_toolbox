import { useGetCardsByTheme } from "@/hooks/useExploreQuery";
import { useParams } from "react-router-dom";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";
import CardByCollectionContainer from "./CardsByCollectionContainer";

export default function CardsByTheme() {
  const { theme } = useParams();
  const { isWaitingForCardsByTheme, cardsByThemeError, cardsByTheme } = useGetCardsByTheme(theme!);

  if (isWaitingForCardsByTheme) return <Loader />;
  if (cardsByThemeError) return <ErrorMessage msg={cardsByThemeError.message} />;

  console.log(cardsByTheme);

  return (
    <>
      <h1 className="text-center font-bold text-5xl my-10">
        Top Commanders: {theme?.slice(0, 1).toLocaleUpperCase()}
        {theme?.slice(1)}
      </h1>
      <CardByCollectionContainer cardCollection={cardsByTheme!} />
    </>
  );
}
