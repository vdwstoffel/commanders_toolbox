import axios, { AxiosError } from "axios";
import { axiosErrorWrapper } from "./apiHelpers";

export class EdhRecApi {
  private base_url: string;

  constructor() {
    this.base_url = "https://json.edhrec.com/pages/commanders";
  }

  slugify(commanders: string[]) {
    let commanderName;

    if (commanders.length === 1) {
      commanderName = commanders[0].split("//")[0]; // For double faced cards remove the second card name
    } else {
      commanderName = commanders.join(" ");
    }

    commanderName = commanderName.replace(/^\s+|\s+$/g, "");
    commanderName = commanderName.toLowerCase();
    commanderName = commanderName
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return commanderName;
  }

  async getDeckStatsByTheme(commander: string[], theme: string) {
    const slug = this.slugify(commander);
    const url = theme.toLowerCase() !== "custom" ? `${this.base_url}/${slug}/${theme}.json` : `${this.base_url}/${slug}.json`;
    const data = await axios.get<EdhDeckThemeStats>(url);
    return data.data;
  }

  /**
   * Function to get the commander theme from edhrec
   * @param commanderName A String with commander names
   * @returns
   */
  async getDeckThemes(commanderName: string[]) {
    const slug = this.slugify(commanderName);
    try {
      const data = await axios.get<GetDeckThemesResponse>(`${this.base_url}/${slug}.json`);
      return data.data.panels.taglinks;
    } catch {
      return null;
    }
  }

  async getCommanders(keyword: string) {
    try {
      const response = await axios.get<TopCommandersInterface>(`${this.base_url}/${keyword}.json`);
      return response.data.container.json_dict.cardlists[0].cardviews;
    } catch (err) {
      axiosErrorWrapper(err as AxiosError);
    }
  }

  /**
   * Fetches top commanders for a specified time period
   * @param period - Time period: "year", "month", or "week"
   * @returns Array of commander cardviews
   */
  async getTopCommander(period: "year" | "month" | "week") {
    return this.getCommanders(period);
  }

  async getCommanderByColor(color: ColorIdentity) {
    return this.getCommanders(color);
  }
}

/** INTERFACES */
export interface EdhDeckThemeStats {
  creature: number;
  instant: number;
  sorcery: number;
  artifact: number;
  enchantment: number;
  battle: number;
  planeswalker: number;
  land: number;
  basic: number;
  nonbasic: number;
  container: { json_dict: { cardlists: { cardviews: { name: string; synergy: number }[]; header: string }[] } };
}

export interface GetDeckThemesResponse {
  panels: { taglinks: { count: number; value: string; slug: string }[] };
}

export interface Theme {
  count: number;
  slug: string;
  value: string;
}

interface TopCommandersInterface {
  container: { json_dict: { cardlists: { cardviews: { name: string }[] }[] } };
}

export type ColorIdentity =
  | "mono-white"
  | "mono-blue"
  | "mono-black"
  | "mono-red"
  | "mono-green"
  | "colorless"
  | "azorius"
  | "dimir"
  | "rakdos"
  | "gruul"
  | "selesnya"
  | "orzhov"
  | "izzet"
  | "golgari"
  | "boros"
  | "simic"
  | "esper"
  | "grixis"
  | "jund"
  | "naya"
  | "bant"
  | "abzan"
  | "jeskai"
  | "sultai"
  | "mardu"
  | "temur"
  | "ink-treader"
  | "witch-maw"
  | "glint-eye"
  | "dune-brood"
  | "yore-tiller"
  | "five-color";
