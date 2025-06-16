import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { createPortal } from "react-dom";

import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScryfallApi, type MagicCard } from "@/api/scryfallApi";

import styles from "./CardSearchWithAutoComplete.module.css";

interface Props {
  label: string
  setValue: Dispatch<SetStateAction<MagicCard | null>>;
}

const scryfallApi = new ScryfallApi();

export default function CardSearchWithAutoComplete({label, setValue }: Props) {
  const [query, setQuery] = useState<string>("");
  const [showList, setShowList] = useState(false);
  const [cardNameAutocompleteResults, setCardNameAutoCompleteResults] = useState<string[]>([]);
  const [dropdownPosition, setDropDownPosition] = useState({ left: 0, top: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  /** FUNCTIONS */
  async function commanderInputHandler(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setShowList(true);
    const autocompleteResults = await scryfallApi.cardAutocomplete(e.target.value);
    setCardNameAutoCompleteResults(autocompleteResults);
  }

  async function onDropDownClickHandler(cardName: string) {
    setQuery(cardName);
    setShowList(false);
    const card = await scryfallApi.getCardByName(cardName);
    setValue(card);
  }

  function updateDropdownPosition() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropDownPosition({
        left: rect.left,
        top: rect.top + 35,
        width: rect.width,
      });
    }
  }

  useEffect(() => {
    if (showList) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showList]);

  /** COMPONENTS */
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="commander" className="text-right">
          {label}
        </Label>
        <Input ref={inputRef} id="commander" defaultValue="" className="col-span-3" value={query} onChange={commanderInputHandler} />
      </div>
      {showList && cardNameAutocompleteResults.length > 0 && (
        <Dropdown position={dropdownPosition}>
          <ul className={styles.dropdownList}>
            {cardNameAutocompleteResults.map((item, index) => (
              <li key={index} className={styles.dropdownItem} onClick={() => onDropDownClickHandler(item)}>
                {item}
              </li>
            ))}
          </ul>
        </Dropdown>
      )}
    </>
  );
}

/**Dropdown component for autocomplete suggestions */
interface DropdownProps {
  children: ReactNode;
  position: { left: number; top: number; width: number };
}

function Dropdown({ children, position }: DropdownProps) {
  return createPortal(
    <div className={styles.dropdown} style={{ left: position.left, top: position.top, width: position.width }}>
      {children}
    </div>,
    document.body
  );
}
