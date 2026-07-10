"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={refreshing}
      className="rounded-md border border-[#c8d7c5] bg-white px-3 py-2 text-sm font-semibold text-[#314632] disabled:opacity-60"
    >
      {refreshing ? "Refreshing..." : "Refresh requests"}
    </button>
  );
}
