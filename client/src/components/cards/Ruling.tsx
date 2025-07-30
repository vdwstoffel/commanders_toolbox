import { useEffect, useState } from "react";

import { ScryfallApi, type CardRulings } from "@/api/scryfallApi";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";

interface Props {
  rulingUri: string;
}

const scryfallApi = new ScryfallApi();

export default function Rulings({ rulingUri }: Readonly<Props>) {
  const [rules, setRules] = useState<CardRulings[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getRules() {
      setIsLoading(true);
      try {
        const rulesResponse = await scryfallApi.getCardRulings(rulingUri);
        setRules(rulesResponse);
        setIsLoading(false);
      } catch {
        setError("An unknown error occurred!");
        setIsLoading(false);
      }
    }

    getRules();
  }, [rulingUri]);

  if (isLoading)
    return (
      <div className="mx-auto w-fit text-right">
        <Loader />
      </div>
    );

  if (error) {
    return <ErrorMessage msg={error} />;
  }

  if (rules!.length < 1) return;

  return (
    <div className="flex flex-col w-72 md:w-auto max-h-72 overflow-auto">
      <h1 className="underline mr-5">Rules</h1>
      {rules?.map((rule, idx) => (
        <div key={rule.oracle_id + idx} className="my-2 mr-5 py-1 text-xs">
          {rule.comment}
        </div>
      ))}
    </div>
  );
}
