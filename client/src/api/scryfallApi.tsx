import axios from "axios";
// https://scryfall.com/docs/api/cards

export class ScryfallApi {
  private base_url: string;

  constructor() {
    this.base_url = "https://api.scryfall.com";
  }

  /**
   * Return a list of card that matches the input string
   * @param name String, partial/full card name
   * @returns string[]
   */
  async cardAutocomplete(name: string): Promise<string[]> {
    const response: CardAutocompleteResponse = await axios.get(this.base_url + `/cards/autocomplete?q=${name}`);
    return response.data.data;
  }

  async getCardByName(cardName: string): Promise<MagicCard> {
    const response: MagicCardResponse = await axios.get(this.base_url + `/cards/named?fuzzy=${cardName}`);
    return response.data;
  }

    async getCardByTcgId(tcgId: number | string): Promise<MagicCard> {
    const response: MagicCardResponse = await axios.get(this.base_url + `/cards/tcgplayer/${tcgId}`);
    return response.data;
  }



  async getCardRulings(rulingsUrl: string): Promise<CardRulings[]> {
    const response = await axios.get<CardRulingsResponse>(rulingsUrl);
    return response.data.data;
  }

  async getAllPrintings(oracleId: string): Promise<PrintingData[]> {
    const response: { data: { data: MagicCard[] } } = await axios.get(
      this.base_url + `/cards/search?order=released&q=oracleid%3A${oracleId}&unique=prints`
    );

    // {oracleId, setName, cardImage
    const printings: PrintingData[] = [];
    for (const card of response.data.data) {
      if (!card.tcgplayer_id) continue;

      const cardInfo = {
        tcgplayer_id: card.tcgplayer_id,
        setName: card.set_name,
        imageUrl: card.image_uris ? card.image_uris.large : card.card_faces![0].image_uris.large,
      };

      printings.push(cardInfo);
    }

    return printings;
  }
}

/** INTERFACES */
interface CardAutocompleteResponse {
  data: {
    data: string[];
  };
}

interface MagicCardResponse {
  data: MagicCard;
}

export interface CardRulingsResponse {
  data: CardRulings[];
}

export interface MagicCard {
  object: string;
  id: string;
  oracle_id: string;
  multiverse_ids: number[];
  mtgo_id?: number;
  tcgplayer_id?: number;
  cardmarket_id?: number;
  name: string;
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;
  layout: "normal" | "adventure" | "modal_dfc" | "transform" | "split" | "meld";
  highres_image: boolean;
  image_status: string;
  image_uris?: ImageUris;
  card_faces?: CardFace[];
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  flavor_text?: string;
  colors: string[];
  color_identity: string[];
  keywords: string[];
  legalities: {
    [format: string]: string;
  };
  games: string[];
  reserved: boolean;
  game_changer: boolean;
  foil: boolean;
  nonfoil: boolean;
  finishes: string[];
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
  variation: boolean;
  set_id: string;
  set: string;
  set_name: string;
  set_type: string;
  set_uri: string;
  set_search_uri: string;
  scryfall_set_uri: string;
  rulings_uri: string;
  prints_search_uri: string;
  collector_number: string;
  digital: boolean;
  rarity: string;
  card_back_id: string;
  artist: string;
  artist_ids: string[];
  illustration_id: string;
  border_color: string;
  frame: string;
  security_stamp?: string;
  full_art: boolean;
  textless: boolean;
  booster: boolean;
  story_spotlight: boolean;
  edhrec_rank?: number;
  penny_rank?: number;
  prices: {
    usd?: string;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string;
    eur_foil?: string | null;
    tix?: string;
  };
  related_uris: {
    gatherer: string;
    tcgplayer_infinite_articles: string;
    tcgplayer_infinite_decks: string;
    edhrec: string;
  };
  purchase_uris: {
    tcgplayer: string;
    cardmarket: string;
    cardhoarder: string;
  };
  all_parts?: {
    object: string;
    id: string;
    component: "combo_piece" | "meld_result" | "meld_part";
    name: string;
    type_line: string;
    uri: string;
  }[];
}

interface CardFace {
  object: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text: string;
  flavor_text?: string;
  colors: string[];
  power?: string;
  toughness?: string;
  color_indicator?: string[];
  artist: string;
  artist_id: string;
  illustration_id: string;
  image_uris: ImageUris;
}

interface ImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface CardRulings {
  object: string;
  oracle_id: string;
  source: string;
  published_at: string;
  comment: string;
}

export interface PrintingData {
  tcgplayer_id: number;
  setName: string;
  imageUrl: string;
}
