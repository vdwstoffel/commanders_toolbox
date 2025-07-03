"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import Loader from "../ui/Loader";
import { useGetDeckColorDistribution } from "./useStatsQuery";

export const description = "A simple pie chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export default function ColorDistributionPieChart() {
  const { isWaitingForColorDistribution, colorDistributionError, colorDistribution } = useGetDeckColorDistribution();

  if (isWaitingForColorDistribution) return <Loader />;
  if (colorDistributionError) throw new Error();

  const chartData = [
    { color: "Plains", value: colorDistribution?.white, fill: "#F9FAF4" },
    { color: "Islands", value: colorDistribution?.blue, fill: "#0E68AB" },
    { color: "Swamps", value: colorDistribution?.black, fill: "#150B00" },
    { color: "Mountains", value: colorDistribution?.red, fill: "#D3202A" },
    { color: "Forests", value: colorDistribution?.green, fill: "#00733E" },
  ];

  return (
    <Card className="flex flex-col w-auto max-w-72 mx-auto">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-center">Mana Color Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="color" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
