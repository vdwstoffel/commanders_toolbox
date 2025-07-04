import axios from "axios";
import type { MagicCard } from "./scryfallApi";
import type { Token } from "./interfaces";

export class BackendDeckApi {
  private base_url: string;

  constructor() {
    this.base_url = "/api/v1/decks";
  }

  async createDeck(deckName: string, deckData: MagicCard[], theme: string, idToken: string): Promise<MagicDeck> {
    const payload = {
      deckName,
      deckData,
      theme,
    };
    try {
      const response: { data: MagicDeck } = await axios.post(this.base_url, payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      console.log(err);
      const error = err as ErrorResponse;
      throw new Error(error.response.statusText);
    }
  }

  async getAllDeckByUserId(idToken: string): Promise<MagicDeck[]> {
    try {
      const response: { data: MagicDeck[] } = await axios.get(this.base_url, { headers: { Authorization: `Bearer ${idToken}` } });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(error.response.statusText);
    }
  }

  /**
   * Return  alist of all the card in a deck by id
   * @param deckId String | Number, Numeric value of the deck
   * @param idToken String: Token id from auth 0
   * @returns An array of DeckCardDetails
   */
  async getDeckById(deckId: number | string, idToken: string): Promise<DeckCardDetails[]> {
    try {
      const response: { data: DeckCardDetails[] } = await axios.get(`${this.base_url}/${deckId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(error.response.statusText);
    }
  }

  async addCardToDeck(deckId: number | string, card: MagicCard, idToken: string) {
    try {
      const response = await axios.post(`${this.base_url}/${deckId}/add-card`, card, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async removeCardFromDeck(deckId: number | string, cardId: number, idToken: string) {
    try {
      await axios.delete(`${this.base_url}/${deckId}/${cardId}`, { headers: { Authorization: `Bearer ${idToken}` } });
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async deleteDeckById(deckId: number | string, idToken: string) {
    try {
      await axios.delete(`${this.base_url}/${deckId}`, { headers: { Authorization: `Bearer ${idToken}` } });
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async getTokensByDeckId(deckId: number | string, idToken: string): Promise<Token[]> {
    try {
      const response: { data: Token[] } = await axios.get(`${this.base_url}/${deckId}/tokens`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async getColorDistributionByDeckId(deckId: string | number, idToken: string) {
    try {
      const response: { data: ColorDistribution } = await axios.get(`${this.base_url}/stats/${deckId}/color-distribution`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async autoPopulateBasicLands(deckId: string | number, idToken: string) {
    try {
      await axios.put(`${this.base_url}/${deckId}/populate-lands`, {}, { headers: { Authorization: `Bearer ${idToken}` } });
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async downloadDeckList(deckId: number, idToken: string) {
    try {
      const res = await axios.get(this.base_url + `/${deckId}/download`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      });

      return res.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async updateDeckDetails(deckId: number | string, deckUpdates: { deckName?: string; deckTheme?: string }, idToken: string) {
    try {
      await axios.put(this.base_url + `/${deckId}`, deckUpdates, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      });
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async updateCardQuantity(deckId: number | string, cardId: number, qty: number, IdToken: string) {
    if (qty > 99) {
      throw new Error("Cannot add more than 99 of a card");
    }

    try {
      const body = { quantity: qty };
      await axios.patch(this.base_url + `/${deckId}/${cardId}`, body, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${IdToken}` },
      });
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async updateCardPrinting(deckId: number | string, originalTcgId: number, newCard: MagicCard, idToken: string) {
    try {
      await axios.put(
        this.base_url + `/${deckId}/update-printing`,
        { originalId: originalTcgId, newCard: newCard },
        {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        }
      );
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  /**
   * Send an array of magicCard details to the backend
   * @param deckId
   * @param cards
   * @param idToken
   */
  async deckUploadText(deckId: number | string, cards: MagicCard[], idToken: string) {
    try {
      await axios.post(
        `${this.base_url}/${deckId}/import-deck-text`,
        { cards },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  /**
   * @description Takes a big string of cards with quantity and the cards name each card followed by a new line and sends it to the backend.
   * @param deckId deckId found in the url
   * @param text String of qty and card name followed by a newline per card
   * @param idToken logged in userID
   * @example 1 Muldrotha, the Gravetide
   */
  async sendEnterTextToBackEnd(deckId: number | string, cardQuantityAndName: cardQuantityAndName[], idToken: string) {
    console.log(cardQuantityAndName);
    try {
      await axios.post(
        `${this.base_url}/${deckId}/import-deck-text`,
        { cardQuantityAndName },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }

  async sendDeckFileToBackend(deckId: number | string, formData: FormData, idToken: string) {
    try {
      await axios.post(`${this.base_url}/${deckId}/upload-deck-file`, formData, {
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.log(err)
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.data}`);
    }
  }
}

/**
 * INTERFACES
 */
interface ErrorResponse {
  response: {
    status: number;
    statusText: string;
    data: string // seems to contain the actual error message
  };
}

export interface MagicDeck {
  deckId: number;
  userId: string;
  deckName: string;
  theme: string;
  commander: string[];
  colorIdentity: string;
  deckImageUri: string[];
}

export interface MagicCardInterface {
  cardName: string;
  colorIdentity: string;
  manaSymbolUris: string[];
  cmc: number;
  cardType: string;
  layout: string;
  cardImageUrl: string[];
  id: number;
}

export interface DeckCardDetails {
  id: number;
  card: MagicCardInterface;
  deck: MagicDeck;
  quantity: number;
  commander: true;
}

interface ColorDistribution {
  white: number;
  blue: number;
  black: number;
  red: number;
  green: number;
}

export interface cardQuantityAndName {
  quantity: number;
  cardName: string;
}
