import { useState } from "react";
import MenuSection from "../features/staff/MenuSection.jsx";
import ReportsSection from "../features/staff/ReportsSection.jsx";
import ReservationsSection from "../features/staff/ReservationsSection.jsx";
import SettingsSection from "../features/staff/SettingsSection.jsx";
import StaffBar from "../features/staff/StaffBar.jsx";
import TablesSection from "../features/staff/TablesSection.jsx";

const SECTIONS = [
  { id: "reports", label: "Reports" },
  { id: "menu", label: "Menu" },
  { id: "reservations", label: "Reservations" },
  { id: "tables", label: "Tables" },
  { id: "settings", label: "Settings" },
];

export default function DashboardPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

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
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={section.id === active}
              aria-controls="dashboard-panel"
              onClick={() => setActive(section.id)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                section.id === active
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="dashboard-panel"
          aria-labelledby={`tab-${active}`}
        >
          {active === "reports" && <ReportsSection />}
          {active === "menu" && <MenuSection />}
          {active === "reservations" && <ReservationsSection />}
          {active === "tables" && <TablesSection />}
          {active === "settings" && <SettingsSection />}
        </div>
      </div>
    </>
  );
}
