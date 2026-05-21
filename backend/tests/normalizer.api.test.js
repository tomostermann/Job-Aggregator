require("module-alias/register");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const https = require("https");
const { normalizeOffer } = require("@/data/normalizer");

const API_KEY = process.env.WELOVEDEVS_API_KEY;

https
  .get(
    "https://epi-api.welovedevs.com/v1?page=0&size=3",
    {
      headers: { "X-API-Key": API_KEY },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log(`Total offres dispo : ${json.totalCount}\n`);
        json.values.forEach((raw, i) => {
          console.log(`--- Offre ${i + 1} ---`);
          console.log(normalizeOffer(raw));
          console.log("");
        });
      });
    },
  )
  .on("error", console.error);
