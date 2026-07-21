export interface Token {
    "magicTokenId": string,
    "tokenName": string,
    "tokenImageUri": string,
    "typeLine": string,
    "oracleText": string,
    "power": string,
    "toughness": string
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