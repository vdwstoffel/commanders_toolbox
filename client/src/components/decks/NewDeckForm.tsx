import { useEffect, useState, type ChangeEvent, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import { PiCardsFill } from "react-icons/pi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ThemeSelectDropdown from "./ThemeSelectDropdown";
import CardSearchWithAutoComplete from "./CardSearchWithAutoComplete";

import { type MagicCard, type PrintingData, ScryfallApi } from "@/api/scryfallApi";
import { EdhRecApi, type Theme } from "../../api/edhRecApi";
import MagicCardImage from "../cards/MagicCardImage";
import { useCreateDeck } from "./useDeckQuery";
import ShowUniquePrintings from "../cards/ShowUniquePrintings";
import OverlayWrapper from "../ui/OverlayWrapper";

const edhRecApi = new EdhRecApi();
const scryfallApi = new ScryfallApi();

export function NewDeckForm() {
  const [deckName, setDeckName] = useState<string>("");
  const [selectedCommanderData, setSelectedCommanderData] = useState<MagicCard | null>(null);
  const [partnerCommanderData, setPartnerCommanderData] = useState<MagicCard | null>(null);
  const [usePartner, setUsePartner] = useState<boolean>(false);
  const [deckTheme, setDeckTheme] = useState<string>("");
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [error, setError] = useState<string>("");
  const { createDeck } = useCreateDeck();

  // Card Printings information
  const [showUniquePrintings, setShowUniquePrintings] = useState<boolean>(false);

  const validPartnerDeck = selectedCommanderData?.keywords.includes("Partner");

  // FUNCTIONS //
  useEffect(() => {
    if (!selectedCommanderData) return;
    async function getTheme() {
      const commanders: string[] = [selectedCommanderData!.name];
      if (partnerCommanderData && usePartner) commanders.push(partnerCommanderData.name);
      const themeData = await edhRecApi.getDeckThemes(commanders!);
      setThemes(themeData);
    }

    getTheme();
  }, [selectedCommanderData, partnerCommanderData, usePartner]);

  function toggleUsePartnerHandler(event: MouseEvent<HTMLButtonElement>) {
    /* onClick seems to be inverted, when enabled is shows false and vice verse */
    const _usePartner = event.currentTarget.ariaChecked !== "true";
    setUsePartner(_usePartner ? true : false);
    if (_usePartner) {
      setPartnerCommanderData(null);
    }
  }

  /** Take a input change event and setStateAction as arguments and updates the correct state */
  function setStateUpdateHandler(e: ChangeEvent<HTMLInputElement>, fn: Dispatch<SetStateAction<string>>) {
    fn(e.target.value);
  }

  function createDeckHandler() {
    if (!deckName) {
      setError("Deck Name Required");
      return;
    }

    if (
      !selectedCommanderData?.type_line.includes("Legendary Creature") &&
      !selectedCommanderData?.oracle_text.includes("can be your commander")
    ) {
      setError(`${selectedCommanderData?.name} is not a valid commander`);
      return;
    }

    //handle partner commanders
    if (
      usePartner &&
      !partnerCommanderData?.type_line.includes("Legendary Creature") &&
      !partnerCommanderData?.oracle_text.includes("can be your commander") &&
      !partnerCommanderData?.keywords.includes("Partner")
    ) {
      setError(`${partnerCommanderData?.name} is not a valid commander`);
      return;
    }

    if (!deckTheme) {
      setError("Theme required");
      return;
    }

    const commanders: MagicCard[] = [selectedCommanderData];
    if (partnerCommanderData && usePartner) commanders.push(partnerCommanderData);

    createDeck({ deckName, commanders, deckTheme });
    setError("");
  }

  async function selectPrintingsHandler() {
    setShowUniquePrintings(true);
  }

  // COMPONENT //
  return (
    <>
      <div className="w-72 sm:w-90 mx-auto">
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 font-bold">{error}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deckName" className="text-right">
              Deck Name
            </Label>

            <Input
              id="deckName"
              defaultValue=""
              className="col-span-3"
              value={deckName}
              onChange={(e) => setStateUpdateHandler(e, setDeckName)}
            />
          </div>

          {validPartnerDeck && (
            <div className="flex items-center space-x-2 mx-auto">
              <Switch id="usePartner" onClick={toggleUsePartnerHandler} />
              <Label htmlFor="usePartner">Partner Commander</Label>
            </div>
          )}

          <CardSearchWithAutoComplete label="Commander" setValue={setSelectedCommanderData} />
          {usePartner && <CardSearchWithAutoComplete label="Partner" setValue={setPartnerCommanderData} />}
          {/* Card Image */}
          <div className="flex gap-2 flex-col md:flex-row">
            <div className="flex flex-col justify-center">
              <MagicCardImage
                imageUrl={
                  selectedCommanderData?.card_faces
                    ? selectedCommanderData.card_faces[0].image_uris.large
                    : selectedCommanderData?.image_uris!.large
                }
              />
              <PiCardsFill onClick={selectPrintingsHandler} />
            </div>
            {usePartner && (
              <MagicCardImage
                imageUrl={
                  partnerCommanderData?.card_faces
                    ? partnerCommanderData.card_faces[0].image_uris.large
                    : partnerCommanderData?.image_uris!.large
                }
              />
            )}
          </div>
          {/* Theme related to the deck */}
          <div className="mx-auto">{themes && <ThemeSelectDropdown themes={themes} setDeckTheme={setDeckTheme} />}</div>
        </div>
        <Button onClick={createDeckHandler}>Create Deck</Button>
      </div>

      {showUniquePrintings && (
        <OverlayWrapper hideFn={() => setShowUniquePrintings(false)}>
          <div className="max-h-screen overflow-auto py-20">
            <div onClick={() => setShowUniquePrintings(false)}>
              <ShowUniquePrintings cardName={selectedCommanderData!.name} setCardFn={setSelectedCommanderData} />
            </div>
          </div>
        </OverlayWrapper>
      )}
    </>
  );
}
