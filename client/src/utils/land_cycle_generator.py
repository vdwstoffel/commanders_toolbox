#!/usr/bin/python

# Script that output some basic information in json format on provided lands.
# Purpose is to quickly gemnerate information the land info for the land cycles
# Good article to get land cycles https://draftsim.com/mtg-land-cycles/
# Expected output
# {
#     cardName: "Seaside Citadel",
#     cardImage: "https://cards.scryfall.io/large/front/a/0/a030b477-3093-4e66-b33d-530b302d795c.jpg?1706241233",
#     colors: ["G", "U", "W"],
# },
import requests
from time import sleep

json_export = []
SCRYFALL_URL = "https://api.scryfall.com/cards/named?fuzzy="
LANDS = [
]

for land in LANDS:
    scryfall_response = requests.get(SCRYFALL_URL + land)
    scryfall_response.raise_for_status()
    res =scryfall_response.json()
    name = res["name"]
    cardImage = res["image_uris"]["large"]
    color_identity = res["color_identity"]
    json_export.append({"cardName": name, "cardImage": cardImage, "colors": color_identity})
    sleep(0.1)

with open("landCycles.txt", "w") as f:
    f.write(f"lands: {json_export}")

print("Done!")


    