import "dotenv/config";
import { runWikidataIngestion } from "../services/scraper/wikidata.js";

async function main() {
  try {
    await runWikidataIngestion();
  } catch (err) {
    console.error("Ingestion failed:", err);
    process.exit(1);
  }
}

main();
