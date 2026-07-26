import SafetyMap from "@/app/components/map/SafetyMap";

export default function MapPage() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          MyOgun Safety Map
        </h1>

        <p className="mt-2 text-slate-600">
          View nearby incidents, threats, guardians and your current location.
        </p>
      </div>

      <SafetyMap />
    </main>
  );
}