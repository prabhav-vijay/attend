import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";
import { hasReturningVisitor, markVisited } from "@/lib/attend/visitor";

export const Route = createFileRoute("/home")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) =>
    pageHead({
      title: "Attend.™ — College Attendance, Clearly Tracked",
      description:
        "Attend.™ is a private, local-first college attendance tracker for semesters, subjects, sessions, holidays, and exams.",
      path: "/home",
      includeShareImage: true,
      ...(loaderData ? { origin: loaderData } : {}),
    }),
  component: HomeSplash,
  staticData: { sitemap: true },
});

function HomeSplash() {
  const navigate = useNavigate();
  const [target, setTarget] = useState<"/about" | "/">("/about");

  useEffect(() => {
    let cancelled = false;
    hasReturningVisitor().then((returning) => {
      if (!cancelled) setTarget(returning ? "/" : "/about");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enter = () => {
    markVisited();
    navigate({ to: target });
  };

  return (
    <main className="relative min-h-screen w-full bg-[#1c1f21]">
      <h1 className="sr-only">Attend.™ — college attendance, clearly tracked</h1>

      <button
        type="button"
        onClick={enter}
        aria-label="Enter Attend."
        className="group relative block h-screen w-full cursor-pointer focus-visible:outline-none"
      >
        <img
          src="/attend-social.png"
          alt="Attend.™ wordmark beside a month calendar of marked college sessions"
          width={1200}
          height={630}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 ring-inset ring-primary group-focus-visible:ring-4" />
      </button>

      <div className="pointer-events-none absolute bottom-5 right-5 rounded-md border-2 border-primary bg-[#f3efe7] px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-lg">
        Click anywhere to enter
      </div>
    </main>
  );
}
