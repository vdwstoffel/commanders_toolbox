import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, type ChangeEvent } from "react";

import { parseImportDeckList } from "@/utils/helperFunctions";
import { ScryfallApi } from "@/api/scryfallApi";
import { useUploadDeckText } from "./useDeckQuery";

const scyfallApi = new ScryfallApi();

export default function FileUpload() {
  // Deck hooks
  const { uploadCards } = useUploadDeckText();

  const [deckValue, setDeckValue] = useState<string>("");

  function updateDeckValueHandler(e: ChangeEvent<HTMLTextAreaElement>) {
    setDeckValue(e.target.value);
  }

  async function deckSubmitHandler() {
    const parsed = parseImportDeckList(deckValue);
    const res = await scyfallApi.getCollection(parsed);
    uploadCards(res);
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
          <div className="grid w-full gap-2">
            <Textarea placeholder="Type your message here." value={deckValue} onChange={updateDeckValueHandler} />
            <Button onClick={deckSubmitHandler}>Submit deck</Button>
          </div>
        </>
      </TabsContent>
    </Tabs>
  );
}
