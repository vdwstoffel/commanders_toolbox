import toast from "react-hot-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, type ChangeEvent } from "react";

import { parseImportDeckList } from "@/utils/helperFunctions";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";
import { useSendTextToBackEnd, useUploadDeckText } from "./useDeckQuery";

const scyfallApi = new ScryfallApi();

interface Props {
  closeFn?: () => void;
}

export default function FileUpload({ closeFn }: Props) {
  // Deck hooks
  const {sendCardText} = useSendTextToBackEnd()

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

    sendCardText(parsed)

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
      <TabsContent value="file">
        <>
        <input type="file" accept=".txt" name="file" className="hover:cursor-pointer"/>
        <Button>Submit</Button>
        </>

      </TabsContent>
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
