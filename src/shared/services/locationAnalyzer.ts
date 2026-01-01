// src/shared/services/locationAnalyzer.ts

import { LOCATION_CLUSTER_MIN_POINTS, LOCATION_CLUSTER_RADIUS_METERS, RECENT_TOP_LOCATION_LIMIT } from "@/appConfig/constants";
import type { FrequentArea } from "@/shared/types/dashboard";
import type { LocationObservation } from "@/shared/types/location";

const EARTH_RADIUS_METERS = 6_371_000;
const RECENCY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_OBSERVATION_ACCURACY = 100;

export interface LocationClusterSummary {
  centroid: {
    lat: number;
    lng: number;
  };
  label: string;
  confidence: number;
  lastSeen: string;
  count: number;
  observations: LocationObservation[];
  representative: LocationObservation;
}

export interface ClusterOptions {
  radiusMeters?: number;
  minPoints?: number;
  limit?: number;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(a: LocationObservation["geo"], b: LocationObservation["geo"]) {
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);
  const deltaLat = latB - latA;
  const deltaLng = toRadians(b.lng - a.lng);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const haversine = sinLat * sinLat + Math.cos(latA) * Math.cos(latB) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function centroidOfObservations(observations: LocationObservation[], indexes: number[]) {
  let latSum = 0;
  let lngSum = 0;
  for (const index of indexes) {
    const geo = observations[index].geo;
    latSum += geo.lat;
    lngSum += geo.lng;
  }

  return {
    lat: latSum / indexes.length,
    lng: lngSum / indexes.length
  };
}

function determineLabel(observations: LocationObservation[], indexes: number[], centroid: { lat: number; lng: number }) {
  const labelCounts = new Map<string, number>();
  for (const index of indexes) {
    const raw = observations[index].label?.trim();
    if (raw) {
      labelCounts.set(raw, (labelCounts.get(raw) ?? 0) + 1);
    }
  }

  if (labelCounts.size > 0) {
    return Array.from(labelCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }

  return `Lat ${centroid.lat.toFixed(4)}, Lng ${centroid.lng.toFixed(4)}`;
}

function selectRepresentativeObservation(observations: LocationObservation[], indexes: number[]) {
  let bestIndex: number | null = null;
  let bestScore = -Infinity;

  for (const index of indexes) {
    const observation = observations[index];
    const parsed = parseTimestamp(observation.capturedAt);
    const ageScore =
      parsed === null ? 0 : clamp(1 - (Date.now() - parsed) / RECENCY_WINDOW_MS, 0, 1);
    const accuracy = observation.accuracyMeters ?? DEFAULT_MAX_OBSERVATION_ACCURACY;
    const accuracyScore = clamp(1 - accuracy / DEFAULT_MAX_OBSERVATION_ACCURACY, 0, 1);
    const score = accuracyScore * 0.6 + ageScore * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex !== null ? observations[bestIndex] : observations[indexes[0]];
}

function summarizeCluster(
  observations: LocationObservation[],
  indexes: number[],
  minPoints: number
): LocationClusterSummary {
  const centroid = centroidOfObservations(observations, indexes);
  const label = determineLabel(observations, indexes, centroid);
  let latestTimestamp: number | null = null;
  let accuracySum = 0;
  let accuracyCount = 0;

  for (const index of indexes) {
    const parsed = parseTimestamp(observations[index].capturedAt);
    if (parsed !== null) {
      latestTimestamp = latestTimestamp === null ? parsed : Math.max(latestTimestamp, parsed);
    }

    const value = observations[index].accuracyMeters ?? DEFAULT_MAX_OBSERVATION_ACCURACY;
    accuracySum += clamp(value, 0, DEFAULT_MAX_OBSERVATION_ACCURACY);
    accuracyCount += 1;
  }

  const averageAccuracy = accuracyCount ? accuracySum / accuracyCount : DEFAULT_MAX_OBSERVATION_ACCURACY;
  const ageScore =
    latestTimestamp === null
      ? 0
      : clamp(1 - (Date.now() - latestTimestamp) / RECENCY_WINDOW_MS, 0, 1);
  const accuracyScore = clamp(1 - averageAccuracy / DEFAULT_MAX_OBSERVATION_ACCURACY, 0, 1);
  const countScore = clamp(indexes.length / (minPoints * 2), 0, 1);
  const confidence = clamp(accuracyScore * 0.3 + ageScore * 0.3 + countScore * 0.4, 0, 1);

  const representative = selectRepresentativeObservation(observations, indexes);

  return {
    centroid,
    label,
    confidence,
    lastSeen: latestTimestamp ? new Date(latestTimestamp).toISOString() : observations[indexes[0]].capturedAt,
    count: indexes.length,
    observations: indexes.map((index) => observations[index]),
    representative
  };
}

function regionQuery(
  observations: LocationObservation[],
  baseIndex: number,
  epsilonMeters: number
) {
  const neighbors: number[] = [];
  for (let i = 0; i < observations.length; i += 1) {
    if (calculateDistanceMeters(observations[baseIndex].geo, observations[i].geo) <= epsilonMeters) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

export function clusterLocationObservations(
  observations: LocationObservation[],
  options: ClusterOptions = {}
): LocationClusterSummary[] {
  const epsilon = options.radiusMeters ?? LOCATION_CLUSTER_RADIUS_METERS;
  const minPoints = options.minPoints ?? LOCATION_CLUSTER_MIN_POINTS;
  const visited = new Set<number>();
  const assigned = new Array(observations.length).fill(false);
  const summaries: LocationClusterSummary[] = [];

  for (let index = 0; index < observations.length; index += 1) {
    if (visited.has(index)) {
      continue;
    }

    visited.add(index);
    const neighbors = regionQuery(observations, index, epsilon);
    if (neighbors.length < minPoints) {
      continue;
    }

    const clusterIndexes = [...neighbors];
    for (let pointer = 0; pointer < clusterIndexes.length; pointer += 1) {
      const neighborIndex = clusterIndexes[pointer];
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const neighborNeighbors = regionQuery(observations, neighborIndex, epsilon);
        if (neighborNeighbors.length >= minPoints) {
          clusterIndexes.push(...neighborNeighbors.filter((neighbor) => !clusterIndexes.includes(neighbor)));
        }
      }

      if (!assigned[neighborIndex]) {
        assigned[neighborIndex] = true;
      }
    }

    summaries.push(
      summarizeCluster(observations, Array.from(new Set(clusterIndexes)), minPoints)
    );
  }

  if (summaries.length === 0 && observations.length > 0) {
    summaries.push(
      summarizeCluster(
        observations,
        observations.map((_, i) => i),
        minPoints
      )
    );
  }

  return summaries.sort((a, b) => b.confidence - a.confidence);
}

export function deriveFrequentAreas(
  observations: LocationObservation[],
  options: ClusterOptions = {}
): FrequentArea[] {
  const limit = options.limit ?? RECENT_TOP_LOCATION_LIMIT;
  return clusterLocationObservations(observations, options)
    .slice(0, limit)
    .map(({ label, confidence, lastSeen, count, representative }) => ({
      label,
      confidence,
      lastSeen,
      count,
      lat: representative.geo.lat,
      lng: representative.geo.lng,
      representative: {
        observationId: representative.observationId,
        source: representative.source,
        capturedAt: representative.capturedAt,
        label: representative.label,
        geo: {
          lat: representative.geo.lat,
          lng: representative.geo.lng
        },
        accuracyMeters: representative.accuracyMeters
      }
    }));
}
