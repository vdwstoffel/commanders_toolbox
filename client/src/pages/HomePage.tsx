import TopCommanderCourasel from "@/explore/TopCommanderCarousel";

export default function HomePage() {
  return (
    <div className="text-center mt-10">
      <h1 className="text-4xl mb-5">Top Commanders all time</h1>
      <TopCommanderCourasel period="year" />

      <h1 className="text-4xl my-5">Top Commanders the last month</h1>
      <TopCommanderCourasel period="month" />
    </div>
  );
}
