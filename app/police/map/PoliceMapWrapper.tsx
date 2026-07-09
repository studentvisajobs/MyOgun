"use client";

import dynamic from "next/dynamic";

const PoliceMapClient = dynamic(() => import("./PoliceMapClient"), {
  ssr: false,
});

type Incident = {
  id: string;
  title: string;
  type: string;
  status: string;
  confidenceScore: number;
  latitude: number;
  longitude: number;
};

export default function PoliceMapWrapper({
  incidents,
}: {
  incidents: Incident[];
}) {
  return <PoliceMapClient incidents={incidents} />;
}