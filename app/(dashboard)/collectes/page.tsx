"use client";

import { Header } from "@/components/dashboard/header";
import { ComptableDashboardView } from "../dashboard/page";

export default function CollectesPage() {
  return (
    <div>
      <Header />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Collectes</h1>
        <ComptableDashboardView />
      </div>
    </div>
  );
}
