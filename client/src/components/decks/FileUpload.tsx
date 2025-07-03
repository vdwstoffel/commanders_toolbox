import toast from "react-hot-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, type ChangeEvent } from "react";

import { parseImportDeckList } from "@/utils/helperFunctions";
import { useSendFileToBackEnd, useSendTextToBackEnd } from "./useDeckQuery";

interface Props {
  closeFn?: () => void;
}

export default function FileUpload({ closeFn }: Props) {
  // Deck hooks
  const { sendCardText } = useSendTextToBackEnd();
  const { deckFileUpload } = useSendFileToBackEnd();
  const [deckValue, setDeckValue] = useState<string>("");

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);

  function updateDeckValueHandler(e: ChangeEvent<HTMLTextAreaElement>) {
    setDeckValue(e.target.value);
  }

  async function deckSubmitHandler() {
    const parsed = parseImportDeckList(deckValue.trim());

    if (parsed.length > 99) {
      toast.error("A maximum of 99 entries can be added");
      return;
    }

    setIsFileUploading(true);
    sendCardText(parsed);

    if (closeFn) {
      closeFn();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  }

  async function handleUpload() {
    if (!file) {
      toast.error("No file selected");
      return;
    }

    // disable upload button
    setIsFileUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    deckFileUpload(formData);

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
          <input type="file" accept=".txt" name="file" onChange={handleFileChange} className="hover:cursor-pointer" />
          <Button onClick={handleUpload} disabled={isFileUploading}>
            Submit
          </Button>
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
            <Button disabled={isFileUploading} onClick={deckSubmitHandler}>
              Submit deck
            </Button>
          </div>
        </>
      </TabsContent>
    </Tabs>
  );
}
