/**
 * API endpoint dedicated to the EdhREc explore functionality
 */

import axios from "axios";

import { axiosErrorWrapper } from "./apiHelpers";

export class BackendExploreAPI {
  private url: string;

  constructor() {
    this.url = "/api/v1/explore";
  }

  async getBatchCardInfo(listOfCards: string[]) {
    try {
      await axios.post(this.url, listOfCards);
    } catch (err) {
        console.log(err)
      axiosErrorWrapper(err as Error);
    }
  }
}
