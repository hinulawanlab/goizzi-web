"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, RefreshCw } from "lucide-react";

import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LocationObservation } from "@/shared/types/location";

const STALE_THRESHOLD_DAYS = 10;
const REFERENCE_TIMESTAMP = Date.now();

function formatDate(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return value;
  }
  return new Date(time).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function buildMapSrc(lat: number, lng: number, zoom = 16) {
  const delta = 0.004;
  const bbox = [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta
  ];
  const bboxString = bbox.map((value) => value.toFixed(6)).join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bboxString}&layer=mapnik&marker=${lat}%2C${lng}`;
}

interface LocationMapProps {
  observation?: LocationObservation;
}

function LocationMap({ observation }: LocationMapProps) {
  const src = useMemo(() => {
    if (!observation) {
      return null;
    }
    return buildMapSrc(observation.geo.lat, observation.geo.lng);
  }, [observation]);

  if (!observation || !src) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        <MapPin className="mr-2 h-4 w-4 text-slate-400" aria-hidden />
        Select a location observation to view it on the map.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-lg">
      <iframe
        title="Borrower location map"
        src={src}
        className="h-64 w-full rounded-3xl"
        allowFullScreen
        loading="lazy"
      />
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs uppercase tracking-[0.4em] text-slate-500">
        <a
          href={`https://www.openstreetmap.org/?mlat=${observation.geo.lat}&mlon=${observation.geo.lng}&zoom=16`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-slate-900 transition hover:text-[#1877f2]"
        >
          Open in OpenStreetMap
        </a>
        <span className="flex items-center gap-1 text-[11px] tracking-[0.4em]">
          Map data refreshed just now <RefreshCw className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

interface ObservationListProps {
  observations: LocationObservation[];
  activeObservationId?: string;
  onSelectObservation: (observation: LocationObservation) => void;
  onCopyCoordinates: (coords: string, observationId: string) => Promise<void>;
  lastCopiedId?: string;
  referenceTimestamp: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function ObservationList({
  observations,
  activeObservationId,
  onSelectObservation,
  onCopyCoordinates,
  lastCopiedId,
  referenceTimestamp,
  onRefresh,
  isRefreshing
}: ObservationListProps) {
  const handleCopy = (observation: LocationObservation) => {
    const coords = `${observation.geo.lat.toFixed(6)}, ${observation.geo.lng.toFixed(6)}`;
    onCopyCoordinates(coords, observation.observationId);
  };

  const isStale = (capturedAt: string) => {
    const parsed = Date.parse(capturedAt);
    if (Number.isNaN(parsed)) {
      return false;
    }
    return referenceTimestamp - parsed > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Observations</p>
          <h3 className="text-lg font-semibold text-slate-900">Raw location signals</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            title="Sync observations"
            aria-label="Sync location observations"
            disabled={isRefreshing}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877f2] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            <span className="sr-only">Refresh location observations</span>
          </button>
          <span className="text-xs text-slate-500">{observations.length} recorded</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-160px text-left text-sm text-slate-600">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
              <th className="px-3 py-2">Captured</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Coords</th>
              <th className="px-3 py-2">Accuracy</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {observations.map((observation) => {
              const isActive = observation.observationId === activeObservationId;
              return (
                <tr
                  key={observation.observationId}
                  className={`transition ${isActive ? "bg-slate-50" : ""} hover:bg-slate-50`}
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{formatDate(observation.capturedAt)}</p>
                    {isStale(observation.capturedAt) && (
                      <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-600">
                        Stale
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                      {observation.source}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{observation.label}</td>
                  <td className="px-3 py-3 text-slate-700">
                    <span className="whitespace-nowrap">
                      {observation.geo.lat.toFixed(6)}, {observation.geo.lng.toFixed(6)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {observation.accuracyMeters ? `${observation.accuracyMeters} m` : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectObservation(observation)}
                        className="cursor-pointer rounded-2xl border border-[#1877f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#1877f2]"
                      >
                        View on map
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => handleCopy(observation)}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500"
                      >
                        <Copy className="inline-block h-3 w-3" aria-hidden />
                        Copy coords
                      </button> */}
                    </div>
                    {lastCopiedId === observation.observationId && (
                      <p className="mt-1 text-[11px] text-emerald-600">Copied to clipboard</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface LocationTabProps {
  borrower: BorrowerSummary;
  observations: LocationObservation[];
  topSourcesCount?: number;
  topAreaLocation?: {
    lat: number;
    lng: number;
    label?: string;
    capturedAt?: string;
  };
}

export default function LocationTab({ borrower, observations, topSourcesCount, topAreaLocation }: LocationTabProps) {
  const [activeObservation, setActiveObservation] = useState<LocationObservation | null>(
    observations[0] ?? null
  );
  const [copiedObservationId, setCopiedObservationId] = useState<string | null>(null);
  const router = useRouter();
  const [isRefreshing, startRefreshing] = useTransition();

  const handleCopyCoordinates = async (coords: string, observationId: string) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(coords);
    }
    setCopiedObservationId(observationId);
    setTimeout(() => setCopiedObservationId(null), 2000);
  };

  const handleRefresh = () => {
    startRefreshing(() => {
      router.refresh();
    });
  };

  const topAreaObservation: LocationObservation | null =
    topAreaLocation && typeof topAreaLocation.lat === "number" && typeof topAreaLocation.lng === "number"
      ? {
          observationId: "top-area",
          source: "derived",
          capturedAt:
            topAreaLocation.capturedAt ?? borrower.locationSummaryUpdatedAt ?? borrower.lastLocationAt,
          label: topAreaLocation.label ?? borrower.topAreaLabel,
          geo: {
            lat: topAreaLocation.lat,
            lng: topAreaLocation.lng
          }
        }
      : null;

  const handleShowTopAreaOnMap = () => {
    if (topAreaObservation) {
      setActiveObservation(topAreaObservation);
    }
  };

  if (!observations.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No location observations yet. Add one via the borrower profile to track actual coordinates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <LocationMap observation={activeObservation ?? observations[0]} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Top area</p>
                {topAreaObservation && (
                  <button
                    type="button"
                    onClick={handleShowTopAreaOnMap}
                    title="Click to view on map"
                    aria-label="Click to view top area on map"
                    className="rounded-full bg-slate-100 p-1 text-slate-500 transition hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
                  >
                    <Eye className="h-4 w-4 cursor-pointer" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">{borrower.topAreaLabel}</p>
              <p className="text-xs text-slate-500">Derived from last observations</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Confidence</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {(borrower.locationConfidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500">
                Updated {borrower.locationSummaryUpdatedAt ?? borrower.lastLocationAt}
                {typeof topSourcesCount === "number" && topSourcesCount > 0 && (
                  <> · ({topSourcesCount} sources)</>
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last seen</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{borrower.lastLocationAt}</p>
              <p className="text-xs text-slate-500">Observations stored chronologically</p>
            </div>
          </div>
        </div>
        <ObservationList
          observations={observations}
          activeObservationId={activeObservation?.observationId}
          onSelectObservation={(observation) => setActiveObservation(observation)}
          onCopyCoordinates={handleCopyCoordinates}
          lastCopiedId={copiedObservationId ?? undefined}
          referenceTimestamp={REFERENCE_TIMESTAMP}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </section>
    </div>
  );
}
