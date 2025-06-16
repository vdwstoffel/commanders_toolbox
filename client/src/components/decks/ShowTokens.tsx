import { useState } from "react";

import { useGetTokens } from "./useDeckQuery";
import Loader from "../ui/Loader";
import MagicCardImage from "@/components/cards/MagicCardImage";

import { type Token } from "../../api/interfaces";
import ErrorMessage from "../ui/ErrorMessage";

export default function ShowTokens() {
  const { waitingForTokens, tokenError, tokens } = useGetTokens();
  const [showUniqueTokens, setShowUniqueTokens] = useState<boolean>(false);

  if (waitingForTokens) return <Loader />;
  // TODO: What do we do on error
  if (tokenError) return <ErrorMessage msg={tokenError.message} />;

  if (!tokens) return;

  console.log(tokens)

  function toggleUniqueHandler() {
    setShowUniqueTokens((unique) => !unique);
  }

  tokens.sort(function (a, b) {
    if (a.tokenName < b.tokenName) {
      return -1;
    }
    if (a.tokenName > b.tokenName) {
      return 1;
    }
    return 0;
  });

  const uniqueTokensNames: string[] = []; // create a string combination of the name oracle_text power and toughness
  const uniqueTokens: Token[] = [];
  // Check if the name is in the unique names, if not add the names to the unique names and the token object to the uniqueTokens
  for (const token of tokens) {
    const uniqueString = token.tokenName + token.oracleText + token.power + token.toughness;
    if (!uniqueTokensNames.includes(uniqueString)) {
      uniqueTokensNames.push(uniqueString);
      uniqueTokens.push(token);
    }
  }

  return (
    <div className="my-10 flex flex-col">
      <div className="mx-auto text-center">
        <label className="inline-flex cursor-pointer items-center">
          <input type="checkbox" value="" className="peer sr-only" onClick={toggleUniqueHandler} />
          <div className="peer relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show All Tokens</span>
        </label>
        <p className="text-xs">Each duplicate token indicates a different card that produces it</p>
      </div>

      <div className="my-10 flex flex-wrap justify-center gap-2">
        {showUniqueTokens
          ? tokens?.map((token, idx) => <MagicCardImage key={token.magicTokenId + idx} imageUrl={token.tokenImageUri} />)
          : uniqueTokens?.map((token, idx) => <MagicCardImage key={token.magicTokenId + idx} imageUrl={token.tokenImageUri} />)}
      </div>
    </div>
  );
}
