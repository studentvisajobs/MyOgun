"use client";

import { useState } from "react";

type Props = {
  latitude: number | null;
  longitude: number | null;
  area: string;
  localGovernment: string;
  setLatitude: (value: number | null) => void;
  setLongitude: (value: number | null) => void;
  onNext: () => void;
  onBack: () => void;
};

type LocationMode =
  | "CURRENT"
  | "OTHER"
  | null;

type SearchResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export default function LocationStep({
  latitude,
  longitude,
  area,
  localGovernment,
  setLatitude,
  setLongitude,
  onNext,
  onBack,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [locationMode, setLocationMode] =
    useState<LocationMode>(null);

const [searchText, setSearchText] =
  useState("");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [selectedAddress, setSelectedAddress] =
    useState("");

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Location is not supported on this device."
      );
      return;
    }

    setLocationMode("CURRENT");
    setSelectedAddress("");
    setResults([]);
    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude
        );
        setLongitude(
          position.coords.longitude
        );
        setLoading(false);
      },
      () => {
        setLatitude(null);
        setLongitude(null);
        setError(
          "We could not get your current location. Please check your location permission and try again."
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function chooseOtherLocation() {
    setLocationMode("OTHER");
    setLatitude(null);
    setLongitude(null);
    setSelectedAddress("");
    setResults([]);
    setError("");
  }

  async function searchLocation() {
    const query = searchText.trim();

    if (!query) {
      setError(
        "Enter the area, town or address where the incident happened."
      );
      return;
    }

    setSearching(true);
    setError("");
    setResults([]);
    setSelectedAddress("");
    setLatitude(null);
    setLongitude(null);

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(
          query
        )}`
      );

      const data = (await response.json()) as {
        locations?: SearchResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Location search failed."
        );
      }

      const locations =
        data.locations ?? [];

      if (locations.length === 0) {
        throw new Error(
          "We could not find that location. Try adding the town, state or country."
        );
      }

      setResults(locations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to search for that location."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectLocation(
    result: SearchResult
  ) {
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setSelectedAddress(
      result.displayName
    );
    setError("");
  }

  const hasLocation =
    latitude !== null &&
    longitude !== null;

  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">
        Where did this happen?
      </h1>

      <p className="mt-3 text-white/60">
        Choose the actual incident location so
        MyOgun only alerts people who are
        genuinely nearby.
      </p>

      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className={`w-full rounded-[2rem] border p-6 text-left transition disabled:opacity-50 ${
            locationMode === "CURRENT"
              ? "border-emerald-500/50 bg-emerald-500/10"
              : "border-white/10 bg-[#111]"
          }`}
        >
          <p className="text-3xl">📍</p>

          <h2 className="mt-3 text-xl font-black">
            {loading
              ? "Getting your location..."
              : "It happened where I am now"}
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Use your phone&apos;s current GPS
            location.
          </p>
        </button>

        <button
          type="button"
          onClick={chooseOtherLocation}
          className={`w-full rounded-[2rem] border p-6 text-left transition ${
            locationMode === "OTHER"
              ? "border-blue-500/50 bg-blue-500/10"
              : "border-white/10 bg-[#111]"
          }`}
        >
          <p className="text-3xl">🗺️</p>

          <h2 className="mt-3 text-xl font-black">
            It happened somewhere else
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Search for the actual incident
            location.
          </p>
        </button>
      </div>

      {locationMode === "OTHER" && (
        <div className="mt-5 rounded-[2rem] border border-blue-500/20 bg-[#111] p-5">
          <label className="text-sm font-black text-white">
            Incident location
          </label>

          <p className="mt-1 text-sm text-white/50">
            Search for the area, town or address
            where the incident actually happened.
          </p>

          <input
            type="text"
            value={searchText}
            onChange={(event) => {
              setSearchText(
                event.target.value
              );
              setLatitude(null);
              setLongitude(null);
              setSelectedAddress("");
              setResults([]);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                event.preventDefault();
                void searchLocation();
              }
            }}
            placeholder="e.g. Oke Ata, Abeokuta, Ogun State, Nigeria"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={searchLocation}
            disabled={searching}
            className="mt-3 w-full rounded-full bg-blue-500 py-4 font-black text-white disabled:opacity-50"
          >
            {searching
              ? "Searching..."
              : "Find Location"}
          </button>

          {results.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-black text-white">
                Select the correct location:
              </p>

              {results.map(
                (result, index) => {
                  const selected =
                    selectedAddress ===
                      result.displayName &&
                    latitude ===
                      result.latitude &&
                    longitude ===
                      result.longitude;

                  return (
                    <button
                      key={`${result.latitude}-${result.longitude}-${index}`}
                      type="button"
                      onClick={() =>
                        selectLocation(
                          result
                        )
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-white/10 bg-black"
                      }`}
                    >
                      <p className="font-bold text-white">
                        {
                          result.displayName
                        }
                      </p>

                      <p className="mt-2 text-xs text-white/50">
                        {result.latitude.toFixed(
                          6
                        )}
                        ,{" "}
                        {result.longitude.toFixed(
                          6
                        )}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
          ⚠️ {error}
        </div>
      )}

      {hasLocation && (
        <div className="mt-5 rounded-[2rem] border border-emerald-500/20 bg-[#111] p-5 text-white/70">
          <p className="font-black text-emerald-400">
            ✅ Incident location confirmed
          </p>

          {selectedAddress && (
            <p className="mt-3 text-sm text-white">
              {selectedAddress}
            </p>
          )}

          <p className="mt-3 text-sm">
            Latitude:{" "}
            {latitude.toFixed(6)}
          </p>

          <p className="mt-1 text-sm">
            Longitude:{" "}
            {longitude.toFixed(6)}
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasLocation}
          className={`rounded-full py-4 font-black transition ${
            hasLocation
              ? "bg-emerald-500 text-black"
              : "cursor-not-allowed bg-white/10 text-white/40"
          }`}
        >
          Continue
        </button>
      </div>
    </section>
  );
}