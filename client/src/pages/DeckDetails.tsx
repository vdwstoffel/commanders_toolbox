import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DeckList from "@/components/decks/DeckList";
import { useDeleteDeck, useGetDeckById, useUpdateDeck } from "@/components/decks/useDeckQuery";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import TypeAverageVsTotal from "@/components/decks/TypeTotalVsAverage";
import ShowTokens from "@/components/decks/ShowTokens";
import CardRecommendations from "@/components/decks/CardRecomendations";
import LandCycles from "@/components/decks/LandCycles";
import ColorDistributionPieChart from "@/components/stats/ColorDistributionPieChart";
import ManaCurveChart from "@/components/stats/ManaCurveChart";
import OverlayWrapper from "@/components/ui/OverlayWrapper";
import { EdhRecApi } from "@/api/edhRecApi";
import PlayTest from "@/components/playtest/Playtest";
import toast from "react-hot-toast";
import FileUpload from "@/components/decks/FileUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const edhRecApi = new EdhRecApi();

// Stronger active-tab accent than the shadcn default subtle highlight
const tabAccent = "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export default function DeckDetails() {
  const { deckId } = useParams();
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();
  const { deleteDeck } = useDeleteDeck();
  const { updateDeck } = useUpdateDeck();
  // When clicking on the deck name edit the deck name
  const [isEditDeckName, setIsEditDeckName] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [isEditTheme, setIsEditTheme] = useState<boolean>(false);
  const [themes, setThemes] = useState<string[]>([""]);
  // Set when Enter/Escape already handled the edit, so the following blur doesn't re-save
  const nameEditHandledRef = useRef<boolean>(false);
  // State for showing the fileupload
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false);

  if (isWaitingForDeck) return <Loader />;
  if (deckByIdError) return <ErrorMessage msg={`There was an error loading deck with deckId: ${deckId}`} />;
  if (!deckById || deckById.length == 0) return <ErrorMessage msg="There was and error fetching the deck" />

  const deckName = deckById[0].deck.deckName;
  const deckTheme = deckById[0].deck.theme;
  const commanderName = deckById[0].deck.commander;
  const deckColorIdentity = deckById[0].deck.colorIdentity;
  const commanderImage = deckById.find((card) => card.commander)?.card.cardImageUrl?.[0];

  function deleteDeckHandler() {
    deleteDeck();
  }

  function clickDeckNameHandler() {
    setNewDeckName(deckName);
    setIsEditDeckName(true);
  }

  function saveDeckName() {
    const trimmed = newDeckName.trim();
    if (trimmed && trimmed !== deckName) {
      updateDeck({ deckName: trimmed });
    }
    setIsEditDeckName(false);
  }

  function cancelDeckNameEdit() {
    setNewDeckName(deckName);
    setIsEditDeckName(false);
  }

  function onDeckNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      nameEditHandledRef.current = true;
      saveDeckName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      nameEditHandledRef.current = true;
      cancelDeckNameEdit();
    }
  }

  function onDeckNameBlur() {
    // Enter/Escape already resolved the edit; don't double-handle on the resulting blur
    if (nameEditHandledRef.current) {
      nameEditHandledRef.current = false;
      return;
    }
    saveDeckName();
  }

  async function onThemeClickHandler() {
    const res = await edhRecApi.getDeckThemes(commanderName);

    if (!res) {
      toast.error("Error getting deck theme");
      return;
    }

    const themes = res.map((info: { slug: string; value: string }) => info.slug);
    setThemes(themes);
    setIsEditTheme(true);
  }

  function setNewThemeHandler(e: string) {
    updateDeck({ deckTheme: e });
    setIsEditTheme(false);
  }

  return (
    <>
      {/* Deck Header */}
      <div className="relative mb-10 overflow-hidden text-center text-muted-foreground">
        {commanderImage && (
          <img
            aria-hidden
            src={commanderImage}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_20%] opacity-25 blur-2xl"
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-card/85" />
        <div className="relative flex flex-col items-center gap-3 px-16 py-8">
          {/* Header actions — pinned to the top-right so the title stays centered */}
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <button
              type="button"
              aria-label="Import cards from file"
              title="Import cards from file"
              className="rounded-md p-2 text-muted-foreground transition hover:cursor-pointer hover:bg-muted hover:text-foreground"
              onClick={() => setShowFileUpload(true)}
            >
              <FaFileUpload />
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Delete deck"
                  title="Delete deck"
                  className="rounded-md p-2 text-destructive transition hover:cursor-pointer hover:bg-destructive/10"
                >
                  <MdDeleteForever className="text-lg" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm delete deck</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this deck.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="hover:bg-destructive/90" onClick={deleteDeckHandler}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Deck name */}
          {isEditDeckName ? (
            <input
              autoFocus
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={onDeckNameKeyDown}
              onBlur={onDeckNameBlur}
              onFocus={(e) => e.target.select()}
              spellCheck={false}
              aria-label="Deck name"
              className="w-full max-w-2xl rounded-md bg-muted p-1 text-center text-5xl font-bold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          ) : (
            <button
              className="group flex items-center gap-2 rounded-md px-2 py-1 text-5xl font-bold text-foreground hover:cursor-pointer"
              onClick={clickDeckNameHandler}
              title="Rename deck"
            >
              {deckName}
              <MdEdit className="text-2xl opacity-0 transition group-hover:opacity-60" aria-hidden />
            </button>
          )}

          {deckColorIdentity && (
            <div className="flex justify-center gap-1">
              {deckColorIdentity.split("").map((c) => (
                <img key={c} src={`https://svgs.scryfall.io/card-symbols/${c}.svg`} alt={c} title={c} className="h-6 w-6" />
              ))}
            </div>
          )}

        {isEditTheme ? (
          <Select onValueChange={(e) => setNewThemeHandler(e)}>
            <SelectTrigger className="w-[180px] mx-auto" onBlur={() => setIsEditTheme(false)}>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent className="max-h-72 capitalize">
              <SelectGroup>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <button
            onClick={onThemeClickHandler}
            title="Change theme"
            className="mx-auto min-w-40 rounded-xl bg-muted px-3 py-2 capitalize hover:cursor-pointer"
          >
            {deckTheme?.replace(/-/g, " ")}
          </button>
        )}
          <TypeAverageVsTotal />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 my-10">
        <Tabs defaultValue="deckList">
          <TabsList className="mx-auto mb-10 overflow-auto max-w-full">
            <TabsTrigger className={tabAccent} value="deckList">
              Deck List
            </TabsTrigger>
            <TabsTrigger className={tabAccent} value="tokens">
              Tokens
            </TabsTrigger>
            <TabsTrigger className={tabAccent} value="recommendations">
              Recommendations
            </TabsTrigger>
            <TabsTrigger className={tabAccent} value="stats">
              Stats
            </TabsTrigger>
            <TabsTrigger className={tabAccent} value="playTest">
              Play Test
            </TabsTrigger>
            <TabsTrigger className={tabAccent} value="landCycles">
              Land Cycles
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deckList">
            <DeckList deck={deckById!} />
          </TabsContent>
          <TabsContent value="tokens">
            <ShowTokens />
          </TabsContent>
          <TabsContent value="recommendations">
            <CardRecommendations commander={deckById![0].deck.commander} theme={deckTheme} />
          </TabsContent>
          <TabsContent value="stats">
            <div className="mx-auto mt-4 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              <ColorDistributionPieChart />
              <ManaCurveChart />
            </div>
          </TabsContent>
          <TabsContent value="playTest">
            <PlayTest />
          </TabsContent>
          <TabsContent value="landCycles">
            <LandCycles />
          </TabsContent>
        </Tabs>
      </div>

      {showFileUpload && (
        <OverlayWrapper hideFn={() => setShowFileUpload(false)}>
          <FileUpload closeFn={() => setShowFileUpload(false)} />
        </OverlayWrapper>
      )}
    </>
  );
}
