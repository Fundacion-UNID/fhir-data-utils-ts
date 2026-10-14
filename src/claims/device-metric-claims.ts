import type { ClaimSpec } from './claim-types.js'

/** Canonical flat claims for FHIR R5 DeviceMetric, including its calibration backbone. */
export const DeviceMetricClaim = {
  Identifier: 'DeviceMetric.identifier',
  Type: 'DeviceMetric.type',
  Unit: 'DeviceMetric.unit',
  Device: 'DeviceMetric.device',
  OperationalStatus: 'DeviceMetric.operational-status',
  Category: 'DeviceMetric.category',
  MeasurementFrequency: 'DeviceMetric.measurement-frequency',
  CalibrationType: 'DeviceMetric.calibration-type',
  CalibrationState: 'DeviceMetric.calibration-state',
  CalibrationTime: 'DeviceMetric.calibration-time',
} as const

export type DeviceMetricClaimKey = typeof DeviceMetricClaim[keyof typeof DeviceMetricClaim]

export const DeviceMetricClaimSpecs: readonly ClaimSpec[] = Object.freeze([
  { key: DeviceMetricClaim.Identifier, meaning: 'Business identifier for the metric.', example: 'metric-1' },
  { key: DeviceMetricClaim.Type, meaning: 'Metric type coding token.', example: 'http://loinc.org|11850-8' },
  { key: DeviceMetricClaim.Unit, meaning: 'Metric unit coding token.', example: 'http://unitsofmeasure.org|mL/min' },
  { key: DeviceMetricClaim.Device, meaning: 'Parent Device reference.', example: 'Device/device-1' },
  { key: DeviceMetricClaim.OperationalStatus, meaning: 'Current operational status.', example: 'on' },
  { key: DeviceMetricClaim.Category, meaning: 'Metric category.', example: 'measurement' },
  { key: DeviceMetricClaim.MeasurementFrequency, meaning: 'Measurement frequency quantity token.', example: '1|Hz' },
  { key: DeviceMetricClaim.CalibrationType, meaning: 'FHIR calibration method.', example: 'two-point' },
  { key: DeviceMetricClaim.CalibrationState, meaning: 'FHIR calibration state.', example: 'calibrated' },
  { key: DeviceMetricClaim.CalibrationTime, meaning: 'Time of the calibration represented by this row.', example: '2026-09-29T15:00:00Z' },
])
