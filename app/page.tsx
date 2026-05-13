import GameClient from "@/components/GameClient";
import { buildCategories } from "@/lib/categories";
import { GOOGLE_SHEET_ERROR_MESSAGE, loadGameData } from "@/lib/googleSheets";
import { generateGrid } from "@/lib/gridGenerator";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const data = await loadGameData();
    const categories = buildCategories(data);
    const initialGrid = generateGrid(categories, data.players.length);

    return (
      <main className="page-shell">
        <GameClient data={data} initialGrid={initialGrid} />
      </main>
    );
  } catch {
    return (
      <main className="page-shell">
        <section className="app-shell error-state">
          <p className="eyebrow">Data Source</p>
          <h1 className="hero-title">LTFB Grid</h1>
          <p className="hero-text">{GOOGLE_SHEET_ERROR_MESSAGE}</p>
          <p className="hero-text muted">
            In Google Sheets, either share the file publicly with view access or publish it to
            the web so the CSV export URLs can be fetched.
          </p>
        </section>
      </main>
    );
  }
}
