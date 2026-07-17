import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { MdDeleteForever } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DeckList from "@/components/decks/DeckList";
import { useDeleteDeck, useGetDeckById, useUpdateDeck } from "@/components/decks/useDeckQuery";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import CardSearchWithAutoComplete from "@/components/decks/CardSearchWithAutoComplete";
import type { MagicCard } from "@/api/scryfallApi";
import TypeAverageVsTotal from "@/components/decks/TypeTotalVsAverage";
import ShowTokens from "@/components/decks/ShowTokens";
import CardRecommendations from "@/components/decks/CardRecomendations";
import LandCycles from "@/components/decks/LandCycles";
import ColorDistributionPieChart from "@/components/stats/ColorDistributionPieChart";
import OverlayWrapper from "@/components/ui/OverlayWrapper";
import AddCardDialog from "@/components/decks/AddCardDialog";
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

export default function DeckDetails() {
  const { deckId } = useParams();
  const [cardToSearch, setCardToSearch] = useState<MagicCard | null>(null);
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();
  const { deleteDeck } = useDeleteDeck();
  const { updateDeck } = useUpdateDeck();
  // When clicking on the deck name edit the deck name
  const [isEditDeckName, setIsEditDeckName] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [isEditTheme, setIsEditTheme] = useState<boolean>(false);
  const [themes, setThemes] = useState<string[]>([""]);
  const deckNameInputRef = useRef<HTMLTextAreaElement>(null);
  const themeSelectRef = useRef<HTMLSelectElement>(null);
  // State for showing the fileupload
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false);

  // Check if the click happened on the deckName input ref
  useEffect(() => {
    function deckNameClickHandler(e: MouseEvent) {
      if (deckNameInputRef.current && !deckNameInputRef.current.contains(e.target as Node)) {
        if (!newDeckName) return; // early return if no deck name is specified
        updateDeck({ deckName: newDeckName });
        setIsEditDeckName(false);
      }
    }
    document.addEventListener("mousedown", deckNameClickHandler, false);
    return () => document.removeEventListener("mousedown", deckNameClickHandler);
  }, [deckId, newDeckName, updateDeck]);

  useEffect(() => {
    function themeSelectHandler(e: MouseEvent) {
      if (themeSelectRef.current && !themeSelectRef.current.contains(e.target as Node)) {
        setIsEditTheme(false);
      }
    }
    document.addEventListener("mousedown", themeSelectHandler, false);
    return () => document.removeEventListener("mousedown", themeSelectHandler);
  }, []);

  if (isWaitingForDeck) return <Loader />;
  if (deckByIdError) return <ErrorMessage msg={`There was an error loading deck with deckId: ${deckId}`} />;
  if (!deckById || deckById.length == 0) return <ErrorMessage msg="There was and error fetching the deck" />

  const deckName = deckById[0].deck.deckName;
  const deckTheme = deckById[0].deck.theme;
  const commanderName = deckById[0].deck.commander;
  const deckColorIdentity = deckById[0].deck.colorIdentity;

  function deleteDeckHandler() {
    deleteDeck();
  }

  function clickDeckNameHandler() {
    setNewDeckName(deckName);
    setIsEditDeckName(true);
  }

  function editDeckNameHandler(e: ChangeEvent<HTMLTextAreaElement>) {
    setNewDeckName(e.target.value);
  }

  function onKeyBoardHandler(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape" || e.key === "Enter") {
      setNewDeckName(deckName);
      setIsEditDeckName(false);

      updateDeck({ deckName: newDeckName });
      setIsEditDeckName(false);
    }
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
      <div className="bg-card text-muted-foreground text-center py-3 mb-10">
        <div className="flex justify-center items-center gap-4">
          {isEditDeckName ? (
            <textarea
              ref={deckNameInputRef}
              defaultValue={newDeckName}
              onKeyDown={onKeyBoardHandler}
              onChange={editDeckNameHandler}
              className="m-0 w-fit overflow-hidden bg-muted p-1 text-5xl font-bold"
              rows={1}
              cols={newDeckName.length}
              spellCheck={false}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <button className="p-1 text-5xl font-bold hover:cursor-pointer" onClick={clickDeckNameHandler}>
              {deckName}
            </button>
          )}
          <div className="flex flex-col justify-center gap-1 items-center">
            <FaFileUpload className="text-sm hover:cursor-pointer" onClick={() => setShowFileUpload(true)} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <MdDeleteForever className="text-destructive hover:cursor-pointer text-xl" />
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
        </div>

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
            className="mx-auto min-w-40 rounded-xl bg-muted px-3 py-2 capitalize hover:cursor-pointer"
          >
            {deckTheme}
          </button>
        )}
        <TypeAverageVsTotal />
      </div>

      <div className="flex w-full flex-col gap-6 my-10">
        <Tabs defaultValue="deckList">
          <TabsList className="mx-auto mb-10 overflow-auto max-w-full">
            <TabsTrigger value="deckList">Deck List</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="playTest">Play Test</TabsTrigger>
            <TabsTrigger value="landCycles">Land Cycles</TabsTrigger>
          </TabsList>
          <TabsContent value="deckList">
            <div className="flex flex-col items-center justify-center px-5">
              <CardSearchWithAutoComplete label="Search Card" setValue={setCardToSearch} />
              {cardToSearch && (
                <OverlayWrapper hideFn={() => setCardToSearch(null)}>
                  <AddCardDialog
                    card={cardToSearch}
                    deckColorIdentity={deckColorIdentity}
                    commanderNames={commanderName}
                    deckCards={deckById!}
                    onClose={() => setCardToSearch(null)}
                  />
                </OverlayWrapper>
              )}
            </div>
            <DeckList deck={deckById!} />
          </TabsContent>
          <TabsContent value="tokens">
            <ShowTokens />
          </TabsContent>
          <TabsContent value="recommendations">
            <CardRecommendations commander={deckById![0].deck.commander} theme={deckTheme} />
          </TabsContent>
          <TabsContent value="stats">
            <ColorDistributionPieChart />
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
