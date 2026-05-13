import { unstable_cache } from "next/cache";
import { normalizeSheetData } from "@/lib/normalizeData";
import type { NormalizedGameData } from "@/lib/types";

export const DEFAULT_SPREADSHEET_ID = "1DHiltHYsJbnQGoJ5TWkCPrU9EUAvDNZ2fELATf1-Wao";
export const GOOGLE_SHEET_ERROR_MESSAGE =
  "Could not load Google Sheet data. Make sure the sheet is shared publicly or published to the web.";

const sheetNames = ["External", "Stats", "Advanced Stats"] as const;

function buildCsvUrl(spreadsheetId: string, sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;
}

async function fetchSheetCsv(spreadsheetId: string, sheetName: string): Promise<string> {
  const response = await fetch(buildCsvUrl(spreadsheetId, sheetName));

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sheetName}: ${response.status}`);
  }

  return response.text();
}

async function loadGameDataUncached(spreadsheetId: string): Promise<NormalizedGameData> {
  try {
    const [externalCsv, statsCsv, advancedStatsCsv] = await Promise.all(
      sheetNames.map((sheetName) => fetchSheetCsv(spreadsheetId, sheetName)),
    );

    return normalizeSheetData({
      spreadsheetId,
      statsCsv,
      advancedStatsCsv,
      externalCsv,
    });
  } catch (error) {
    console.error("Failed to load Google Sheet data", error);
    throw new Error(GOOGLE_SHEET_ERROR_MESSAGE);
  }
}

const loadCachedGameData = unstable_cache(loadGameDataUncached, ["ltfb-grid-sheet-data"], {
  revalidate: 300,
});

export async function loadGameData(
  spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SPREADSHEET_ID,
): Promise<NormalizedGameData> {
  return loadCachedGameData(spreadsheetId);
}
