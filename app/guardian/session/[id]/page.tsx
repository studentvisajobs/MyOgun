"use client";

import {
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import GuardianDashboard, {
  type GuardianDashboardData,
} from "@/app/components/guardian/GuardianDashboard";

import { GuardianDashboardService } from "@/lib/services/GuardianDashboardService";
import { GuardianRealtimeService } from "@/lib/services/GuardianRealtimeService";

type DashboardResponse = {
  success: boolean;
  error?: string;
  dashboard?: GuardianDashboardData;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function GuardianSessionPage({
  params,
}: PageProps) {
  const { id } = use(params);

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
const dashboard =
  await GuardianDashboardService.getSession(id);

setData({
  success: true,
  dashboard,
});
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Guardian Dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

useEffect(() => {
  const unsubscribe =
    GuardianRealtimeService.subscribe(
      id,
      GuardianDashboardService.getSession,
      (dashboard) => {
        setData({
          success: true,
          dashboard,
        });

        setError(null);
        setLoading(false);
      }
    );

  return unsubscribe;
}, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl">🛡️</div>

          <p className="mt-4 font-semibold">
            Loading Guardian Dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!data?.success || !data.dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-red-400">
        <div className="text-center">
          <p>
            {error ||
              "Unable to load Guardian Dashboard."}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadDashboard();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-500"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <GuardianDashboard
      dashboard={data.dashboard}
    />
  );
}