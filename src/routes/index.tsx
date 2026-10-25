import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DateEditor } from "@/components/attend/DateEditor";
import { Legend } from "@/components/attend/StatusMark";
import { MonthGrid } from "@/components/attend/MonthGrid";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({
    title: "College Attendance Calendar — Attend.™",
    description: "Mark present, absent, excused, or cancelled college sessions on a semester calendar.",
    path: "/",
    ...(loaderData ? { origin: loaderData } : {}),
    ...(loaderData ? { jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Attend.™",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any modern web browser",
      description: "A local-first college attendance tracker for semesters, subjects, sessions, holidays, and events.",
      url: loaderData,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    } } : {}),
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const [date, setDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h1 className="sr-only">Calendar</h1>
      <Legend />
      <MonthGrid month={month} onMonthChange={setMonth} onOpenDate={setDate} />
      <DateEditor date={date} onClose={() => setDate(null)} />
    </div>
  );
}
