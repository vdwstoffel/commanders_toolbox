"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import Loader from "../ui/Loader";
import { useGetDeckById } from "../decks/useDeckQuery";

const chartConfig = {
  count: {
    label: "Cards",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// Highest bucket collects everything at that mana value or above (e.g. "7+")
const MAX_BUCKET = 7;

export default function ManaCurveChart() {
  const { isWaitingForDeck, deckByIdError, deckById } = useGetDeckById();

  if (isWaitingForDeck) return <Loader />;
  if (deckByIdError) throw new Error("Could not load deck");

  // Bucket non-land cards by converted mana cost, weighted by quantity
  const counts = new Array(MAX_BUCKET + 1).fill(0);
  deckById?.forEach((dc) => {
    if (dc.card.cardType === "land") return;
    const cmc = Math.max(0, Math.floor(dc.card.cmc ?? 0));
    counts[Math.min(cmc, MAX_BUCKET)] += dc.quantity;
  });

  const chartData = counts.map((count, cmc) => ({
    cmc: cmc === MAX_BUCKET ? `${MAX_BUCKET}+` : String(cmc),
    count,
  }));

  return (
    <Card className="flex w-full flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-center">Mana Curve</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-video max-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="cmc" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis hide allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="cmc" />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4}>
              <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
