import axios from "axios";

export class EdhRecApi {
  private base_url: string;

  constructor() {
    this.base_url = "https://json.edhrec.com/pages/commanders";
  }

  slugify(commanderName: string) {
    commanderName = commanderName.replace(/^\s+|\s+$/g, "");
    commanderName = commanderName.toLowerCase();
    commanderName = commanderName
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return commanderName;
  }

  async getDeckStatsByTheme(commander: string[], theme: string) {

    let slug;

    if (commander.length === 1) {
      slug = this.slugify(commander[0].split("//")[0]); // For double faced cards remove the second card name
    } else {
      slug = this.slugify(commander.join(" "));
    }

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
    let slug;

    if (commanderName.length === 1) {
      slug = this.slugify(commanderName[0].split("//")[0]); // For double faced cards remove the second card name
    } else {
      slug = this.slugify(commanderName.join(" "));
    }

    try {
      const data = await axios.get<GetDeckThemesResponse>(`${this.base_url}/${slug}.json`);
      return data.data.panels.taglinks;
    } catch {
      return null;
    }
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
