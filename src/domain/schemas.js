import { z } from 'zod';

const positiveFiniteNumber = z.number().positive().finite();

export const FleetSpecSchema = z.object({
  hubHeight: positiveFiniteNumber,
  rotorDiameter: positiveFiniteNumber,
  ratedPower: positiveFiniteNumber,
});

export const MapViewSchema = z.object({
  center: z.tuple([z.number().finite(), z.number().finite()]),
  zoom: z.number().nonnegative(),
});

export const TurbineSchema = z.object({
  id: z.string().min(1),
  lat: z.number().finite(),
  lng: z.number().finite(),
  name: z.string(),
  custom: FleetSpecSchema.nullable(),
});

export const StoredLayoutSchema = z.object({
  turbines: z.array(TurbineSchema),
  fleet: FleetSpecSchema,
  mapView: MapViewSchema.optional(),
});
