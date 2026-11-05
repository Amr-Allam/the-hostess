import { useState } from "react";
import StaffBar from "../features/staff/StaffBar.jsx";

// Owner dashboard sections. Each section's content is added in its own step.
const SECTIONS = [
  { id: "reports", label: "Reports" },
  { id: "menu", label: "Menu" },
  { id: "reservations", label: "Reservations" },
  { id: "tables", label: "Tables" },
  { id: "settings", label: "Settings" },
];

function SectionPlaceholder({ label }) {
  return <p className="text-stone-500">{label} is coming soon.</p>;
}

export default function DashboardPage() {
  const [active, setActive] = useState(SECTIONS[0].id);
  const section = SECTIONS.find((s) => s.id === active);

  return (
    <>
      <StaffBar />
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto border-b border-stone-200"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={s.id === active}
              aria-controls="dashboard-panel"
              onClick={() => setActive(s.id)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                s.id === active
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="dashboard-panel"
          aria-labelledby={`tab-${active}`}
        >
          <SectionPlaceholder label={section.label} />
        </div>
      </div>
    </>
  );
}
