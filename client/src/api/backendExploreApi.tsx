/**
 * API endpoint dedicated to the EdhREc explore functionality
 */

import axios, { AxiosError } from "axios";

import { axiosErrorWrapper } from "./apiHelpers";
import type { MagicCardInterface } from "./interfaces";

export class BackendExploreAPI {
  private url: string;

  constructor() {
    this.url = "/api/v1/explore";
  }

  async getBatchCardInfo(listOfCards: string[]) {
    try {
      const response: {data: MagicCardInterface[]} = await axios.post(this.url, {cards: listOfCards});
      return response.data
    } catch (err) {
      axiosErrorWrapper(err as AxiosError);
    }
  }
}
