import toast from "react-hot-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, type ChangeEvent } from "react";

import { parseImportDeckList } from "@/utils/helperFunctions";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";
import { useUploadDeckText } from "./useDeckQuery";

const scyfallApi = new ScryfallApi();

interface Props {
  closeFn?: () => void;
}

export default function FileUpload({ closeFn }: Props) {
  // Deck hooks
  const { uploadCards } = useUploadDeckText();

  const [deckValue, setDeckValue] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  function updateDeckValueHandler(e: ChangeEvent<HTMLTextAreaElement>) {
    setDeckValue(e.target.value);
  }

  async function deckSubmitHandler() {
    const parsed = parseImportDeckList(deckValue.trim());

    if (parsed.length > 99) {
      toast.error("A maximum of 99 entries can be added");
      return;
    }

    let batch: MagicCard[];
    // A maximum of 75 cards can be query at once from scryfall, so if there are more than 75 cards do it in batches

    setIsBusy(true);
    const loadingToast = toast.loading("Gathering info");
    if (parsed.length > 75) {
      const firstBatch = await scyfallApi.getCollection(parsed.slice(0, 75));
      const secondBatch = await scyfallApi.getCollection(parsed.slice(75));
      batch = [...firstBatch, ...secondBatch];
    } else {
      batch = await scyfallApi.getCollection(parsed);
    }
    toast.dismiss(loadingToast);

    try {
      uploadCards(batch);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsBusy(false);
    }

    if (closeFn) {
      closeFn();
    }
  }

  return (
    <Tabs defaultValue="file" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="file">Upload file</TabsTrigger>
        <TabsTrigger value="text">Enter Text</TabsTrigger>
      </TabsList>
      <TabsContent value="file">Make changes to your account here.</TabsContent>
      <TabsContent value="text">
        <>
          <p className="text-center font-bold my-4">Paste the deck list here. ex 1 Muldrotha</p>
          <div className="grid w-full gap-2 max-h-96">
            <Textarea
              placeholder="Type your message here."
              value={deckValue}
              onChange={updateDeckValueHandler}
              className="max-h-92 overflow-auto"
            />
            <Button disabled={isBusy} onClick={deckSubmitHandler}>
              Submit deck
            </Button>
          </div>
        </>
      </TabsContent>
    </Tabs>
  );
}
