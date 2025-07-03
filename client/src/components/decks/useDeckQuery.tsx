import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { useUser } from "../user/useUser";
import { BackendDeckApi, type cardQuantityAndName } from "@/api/backendDeckApi";
import { EdhRecApi } from "@/api/edhRecApi";
import type { MagicCard } from "@/api/scryfallApi";

const deckApi = new BackendDeckApi();
const edhRecApi = new EdhRecApi();

export function useGetDecks(idToken: string) {
  const {
    isPending: waitingForDecks,
    error: getDecksError,
    data: deckData,
  } = useQuery({
    queryKey: ["decks"],
    queryFn: () => deckApi.getAllDeckByUserId(idToken),
  });

  return { waitingForDecks, getDecksError, deckData };
}

export function useGetDeckById() {
  const { deckId } = useParams();
  const { idToken } = useUser();

  const {
    isPending: isWaitingForDeck,
    data: deckById,
    error: deckByIdError,
  } = useQuery({
    queryKey: ["deckById"],
    queryFn: () => deckApi.getDeckById(Number(deckId), idToken),
  });

  return { deckById, isWaitingForDeck, deckByIdError };
}

export function useCreateDeck() {
  const queryClient = useQueryClient();
  const { idToken } = useUser();
  const navigate = useNavigate();

  const { isPending: waitingToCreateDeck, mutate: createDeck } = useMutation({
    mutationFn: ({ deckName, commanders, deckTheme }: CreateDeckArgs) =>
      deckApi.createDeck(deckName, commanders, deckTheme, idToken),
    onSuccess: (e) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      navigate("/decks/" + e.deckId);
    },
    onError: () => alert("make a toast showing an error when creatiung deck"),
  });

  return { waitingToCreateDeck, createDeck };
}

export function useAddCardToDeck() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending: addingCard, mutate: addCard } = useMutation({
    mutationFn: (cardData: MagicCard) => deckApi.addCardToDeck(deckId!, cardData, idToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
      toast("Card added to deck");
    },
    onError: (error) => toast(`Could not add card\n` + error),
  });

  return { addingCard, addCard };
}

export function useRemoveCardFromDeck() {
  const queryClient = useQueryClient();

  const { isPending: waitingToRemove, mutate: removeCard } = useMutation({
    mutationFn: ({ deckId, cardId, idToken }: RemoveCardArgs) => deckApi.removeCardFromDeck(deckId, cardId, idToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deckById"] }),
    onError: (error) => toast(`Could not delete card\n` + error),
  });

  return { waitingToRemove, removeCard };
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending: waitingForUpdateDeck, mutate: updateDeck } = useMutation({
    mutationFn: (deckUpdates: { deckName?: string; deckTheme?: string }) => deckApi.updateDeckDetails(deckId!, deckUpdates, idToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edhCommanderData"] });
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
    },
    onError: (error) => toast(`Could not delete card\n` + error),
  });

  return { waitingForUpdateDeck, updateDeck };
}

export function useUploadDeckText() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const upload = (cards: MagicCard[]) => {
    // Show a loading toast will processing the cards
    return toast.promise(deckApi.deckUploadText(deckId!, cards, idToken), {
      loading: "Uploading cards...",
      success: "Cards Imported",
      error: (err) => "Error Uploading cards\n" + (err.message || err),
    });
  };

  const { isPending: waitingForUpload, mutate: uploadCards } = useMutation({
    mutationFn: upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
    },
  });

  return { waitingForUpload, uploadCards };
}

export function useSendTextToBackEnd() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const upload = (uploadDetails: cardQuantityAndName[]) => {
    // Show a loading toast will processing the cards
    return toast.promise(deckApi.sendEnterTextToBackEnd(deckId!, uploadDetails, idToken), {
      loading: "Uploading cards...",
      success: "Cards Imported",
      error: (err) => "Error Uploading cards\n" + (err.message || err),
    });
  };

  const { isPending: waitingForUpload, mutate: sendCardText } = useMutation({
    mutationFn: upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
    },
  });

  return { waitingForUpload, sendCardText };
}

export function useSendFileToBackEnd() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const upload = (formData: FormData) => {
    // Show a loading toast will processing the cards
    return toast.promise(deckApi.sendDeckFileToBackend(deckId!, formData, idToken), {
      loading: "Uploading cards...",
      success: "Cards Imported",
      error: (err) => "Error Uploading cards\n" + (err.message || err),
    });
  };

  const { isPending: waitingForFileUpload, mutate: deckFileUpload } = useMutation({
    mutationFn: upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
    },
  });

  return { waitingForFileUpload, deckFileUpload };
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();
  const { idToken } = useUser();
  const { deckId } = useParams();
  const navigate = useNavigate();

  const { isPending: waitingToDeleteDeck, mutate: deleteDeck } = useMutation({
    mutationFn: () => deckApi.deleteDeckById(deckId!, idToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      navigate("/decks");
    },
    onError: (error) => toast("Error when deleting deck\n" + error),
  });

  return { waitingToDeleteDeck, deleteDeck };
}

export function useUpdateCardQuantity() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending, mutate: updateCardQty } = useMutation({
    mutationFn: ({ cardId, quantity }: { cardId: number; quantity: number }) =>
      deckApi.updateCardQuantity(deckId!, cardId, quantity, idToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
    },
    onError: (error) => toast("Error when updating card quantity\n" + error),
  });

  return { isPending, updateCardQty };
}

export function useUpdateCardPrinting() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending, mutate: updateCardPrinting } = useMutation({
    mutationFn: ({ originalId, newCard }: { originalId: number; newCard: MagicCard }) =>
      deckApi.updateCardPrinting(deckId!, originalId, newCard, idToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
      toast("Printing updated");
    },
    onError: (error) => toast("Error when updating card printing\n" + error),
  });

  return { isPending, updateCardPrinting };
}

// Function to get all the tokens for a given deck
export function useGetTokens() {
  const { deckId } = useParams();
  const { idToken } = useUser();

  const {
    isPending: waitingForTokens,
    error: tokenError,
    data: tokens,
  } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => deckApi.getTokensByDeckId(deckId!, idToken),
  });

  return { waitingForTokens, tokenError, tokens };
}

export function usePopulateBasicLands() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending: waitingToPopulateLands, mutate: populateLands } = useMutation({
    mutationFn: () => deckApi.autoPopulateBasicLands(deckId!, idToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deckById"] }),
    onError: (err) => toast(`Error populating basic lands\n ${err}`),
  });

  return { waitingToPopulateLands, populateLands };
}

export function useEdhRecCommanderStats(commander: string[], theme: string) {
  const { isPending, data, error } = useQuery({
    queryKey: ["edhCommanderData"],
    queryFn: () => edhRecApi.getDeckStatsByTheme(commander, theme),
  });

  const recs = data?.container.json_dict.cardlists;
  const typeAverages = {
    creatures: data?.creature || 0,
    instants: data?.instant || 0,
    sorceries: data?.sorcery || 0,
    artifacts: data?.artifact || 0,
    enchantments: data?.enchantment || 0,
    battles: data?.battle || 0,
    planeswalkers: data?.planeswalker || 0,
    lands: data?.land,
  };

  return { isPending, error, data, recs, typeAverages };
}

/**
 * INTERFACES
 */
interface CreateDeckArgs {
  deckName: string;
  commanders: MagicCard[];
  deckTheme: string;
}

interface AddCardArgs {
  deckId: number | string;
  cardData: MagicCard;
  idToken: string;
}

interface RemoveCardArgs {
  deckId: number | string;
  cardId: number;
  idToken: string;
}
