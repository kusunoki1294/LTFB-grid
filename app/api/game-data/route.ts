import { NextResponse } from "next/server";
import { GOOGLE_SHEET_ERROR_MESSAGE, loadGameData } from "@/lib/googleSheets";

export async function GET() {
  try {
    const data = await loadGameData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        error: GOOGLE_SHEET_ERROR_MESSAGE,
      },
      {
        status: 500,
      },
    );
  }
}
