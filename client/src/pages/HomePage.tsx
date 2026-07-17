import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import TopCommanderCarousel from "@/components/explore/TopCommanderCarousel";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="border-b border-border bg-[radial-gradient(120%_120%_at_50%_0%,var(--muted)_0%,var(--background)_70%)] px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-foreground">Build Your Perfect Commander Deck</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Build, analyze, and explore EDH decks with real card data.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => navigate("/decks/new-deck")}>Create a Deck</Button>
          <Button variant="outline" onClick={() => navigate("/explore/color")}>
            Explore Decks
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Top Commanders — All Time</h2>
        <TopCommanderCarousel period="year" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Trending This Month</h2>
        <TopCommanderCarousel period="month" />
      </section>
    </div>
  );
}
