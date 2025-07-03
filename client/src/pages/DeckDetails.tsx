import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { MdDeleteForever } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { FaFileUpload } from "react-icons/fa";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DeckList from "@/components/decks/DeckList";
import { useAddCardToDeck, useDeleteDeck, useGetDeckById, useUpdateDeck } from "@/components/decks/useDeckQuery";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";
import CardSearchWithAutoComplete from "@/components/decks/CardSearchWithAutoComplete";
import type { MagicCard } from "@/api/scryfallApi";
import { Button } from "@/components/ui/button";
import TypeAverageVsTotal from "@/components/decks/TypeTotalVsAverage";
import ShowTokens from "@/components/decks/ShowTokens";
import CardRecommendations from "@/components/decks/CardRecomendations";
import LandCycles from "@/components/decks/LandCycles";
import ColorDistributionPieChart from "@/components/stats/ColorDistributionPieChart";
import OverlayWrapper from "@/components/ui/OverlayWrapper";
import FullCardInfo from "@/components/cards/FullCardInfo";
import { EdhRecApi } from "@/api/edhRecApi";
import PlayTest from "@/components/playtest/Playtest";
import toast from "react-hot-toast";
import FileUpload from "@/components/decks/FileUpload";

const edhRecApi = new EdhRecApi();

export default function DeckDetails() {
  const { deckId } = useParams();
  const [cardToSearch, setCardToSearch] = useState<MagicCard | null>(null);
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();
  const { addCard } = useAddCardToDeck();
  const { deleteDeck } = useDeleteDeck();
  const { updateDeck } = useUpdateDeck();
  const [showCardInfoOverlay, setShowCardInfoOverlay] = useState<boolean>(false);
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

  const deckName = deckById![0].deck.deckName;
  const deckTheme = deckById![0].deck.theme;
  const commanderName = deckById![0].deck.commander;
  const deckColorIdentity = deckById![0].deck.colorIdentity;

  function addCardToDeckHandler() {
    if (!cardToSearch) return;

    // Check if the card matches the color identity
    const cardIdentity = cardToSearch.color_identity;
    for (const color of cardIdentity) {
      if (!deckColorIdentity.includes(color)) {
        toast.error(`${cardToSearch.name} is not in the color identity`);
        return;
      }
    }

    // Check that you cannot add the commander to the deck
    if (commanderName.includes(cardToSearch.name)) {
      toast.error("Cannot add commander to deck");
      return;
    }

    addCard(cardToSearch);
    toast.success(`${cardToSearch.name} added to deck`);
    setCardToSearch(null);
  }

  function deleteDeckHandler() {
    deleteDeck();
  }

  function toggleCardInfoOverlayHandler() {
    setShowCardInfoOverlay(!showCardInfoOverlay);
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
    }

    const themes = res!.map((info: { slug: string; value: string }) => info.slug);
    setThemes(themes);
    setIsEditTheme(true);
  }

  function setNewThemeHandler(e: ChangeEvent<HTMLSelectElement>) {
    updateDeck({ deckTheme: e.target.value });
    setIsEditTheme(false);
  }

  return (
    <>
      {/* Deck Header */}
      <div className="bg-stone-800 text-stone-300 text-center py-3 mb-10">
        <div className="flex justify-center items-center gap-4">
          {isEditDeckName ? (
            <textarea
              ref={deckNameInputRef}
              defaultValue={newDeckName}
              onKeyDown={onKeyBoardHandler}
              onChange={editDeckNameHandler}
              className="m-0 w-fit overflow-hidden bg-slate-500/30 p-1 text-5xl font-bold"
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
          <div className="flex flex-col justify-center justify-items-center gap-1">
            <FaFileUpload className="text-sm hover:cursor-pointer" onClick={() => setShowFileUpload(true)} />
            <MdDeleteForever className="text-red-700 hover:cursor-pointer text-xl" onClick={deleteDeckHandler} />
          </div>
        </div>

        {isEditTheme ? (
          <select
            onBlur={() => setIsEditTheme(false)}
            ref={themeSelectRef}
            onChange={setNewThemeHandler}
            className="capitalize mx-auto mt-3 w-fit rounded-xl bg-slate-100/30 px-3"
          >
            <option className="bg-neutral-900 text-neutral-200">Select Theme</option>
            <option key={"custom"} value={"custom"} className="bg-neutral-900 text-neutral-200">
              Custom
            </option>

            {themes.map((theme) => (
              <option key={theme} value={theme} className="bg-neutral-900 text-neutral-200">
                {theme}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={onThemeClickHandler}
            className="mx-auto my-3 mb-0 w-fit rounded-xl bg-slate-100/30 px-3 capitalize hover:cursor-pointer"
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
            <div className="flex justify-center items-center flex-col mb-10 px-5">
              <div className="flex items-center gap-2">
                <CardSearchWithAutoComplete label="Search Card" setValue={setCardToSearch} />
                <FaEye onClick={toggleCardInfoOverlayHandler} />
              </div>
              <Button onClick={addCardToDeckHandler} className="my-5">
                Add card
              </Button>
              {showCardInfoOverlay && cardToSearch && (
                <OverlayWrapper hideFn={toggleCardInfoOverlayHandler}>
                  <FullCardInfo cardName={cardToSearch!.name} />
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
