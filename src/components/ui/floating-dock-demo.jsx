import React from "react";
import { FloatingDock } from "./floating-dock";

export const IconHome = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
);

export const IconBook = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
    <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
    <path d="M3 6v13" />
    <path d="M12 6v13" />
    <path d="M21 6v13" />
  </svg>
);

export const IconClock = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const IconChecklist = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.615 20h-4.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8" />
    <path d="M14 19l2 2l4 -4" />
    <path d="M9 8h4" />
    <path d="M9 12h2" />
  </svg>
);

export const IconChartBar = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M15 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M9 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M4 20h14" />
  </svg>
);

export function FloatingDockDemo({ activeTab, onTabChange }) {
  const links = [
    {
      title: "Dashboard",
      icon: (
        <IconHome className="h-full w-full text-neutral-300 hover:text-white transition-colors" />
      ),
      href: "#",
      onClick: () => onTabChange && onTabChange("Study"),
    },
    {
      title: "Modules & Syllabus",
      icon: (
        <IconBook className="h-full w-full text-neutral-300 hover:text-white transition-colors" />
      ),
      href: "#",
      onClick: () => onTabChange && onTabChange("Library"),
    },
    {
      title: "Focus Timer",
      icon: (
        <IconClock className="h-full w-full text-neutral-300 hover:text-white transition-colors" />
      ),
      href: "#",
      onClick: () => onTabChange && onTabChange("Timer"),
    },
    {
      title: "Tasks & Objectives",
      icon: (
        <IconChecklist className="h-full w-full text-neutral-300 hover:text-white transition-colors" />
      ),
      href: "#",
      onClick: () => onTabChange && onTabChange("Tasks"),
    },
    {
      title: "Analytics & Stats",
      icon: (
        <IconChartBar className="h-full w-full text-neutral-300 hover:text-white transition-colors" />
      ),
      href: "#",
      onClick: () => onTabChange && onTabChange("Stats"),
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex items-center justify-center pointer-events-auto px-4">
      <FloatingDock items={links} />
    </div>
  );
}

export default FloatingDockDemo;
