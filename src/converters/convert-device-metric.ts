import { DeviceMetricClaim } from '../claims/device-metric-claims.js'
import type { FhirResource, FlatClaims } from './convert-shared.js'
import { codingFromValue, codingToValue, referenceToValue } from './convert-shared.js'

export function deviceMetricFlatToFhirR5(claims: FlatClaims): FhirResource {
  const calibration = claims[DeviceMetricClaim.CalibrationType]
    || claims[DeviceMetricClaim.CalibrationState]
    || claims[DeviceMetricClaim.CalibrationTime]
    ? [{
      type: claims[DeviceMetricClaim.CalibrationType],
      state: claims[DeviceMetricClaim.CalibrationState],
      time: claims[DeviceMetricClaim.CalibrationTime],
    }]
    : undefined
  return {
    resourceType: 'DeviceMetric',
    identifier: claims[DeviceMetricClaim.Identifier] ? [{ value: claims[DeviceMetricClaim.Identifier] }] : undefined,
    type: { coding: codingFromValue(claims[DeviceMetricClaim.Type]) },
    unit: claims[DeviceMetricClaim.Unit] ? { coding: codingFromValue(claims[DeviceMetricClaim.Unit]) } : undefined,
    device: claims[DeviceMetricClaim.Device] ? { reference: claims[DeviceMetricClaim.Device] } : undefined,
    operationalStatus: claims[DeviceMetricClaim.OperationalStatus],
    category: claims[DeviceMetricClaim.Category],
    calibration,
  }
}

export function deviceMetricFhirR5ToFlat(resource: FhirResource): FlatClaims {
  const calibration = (resource.calibration as Array<Record<string, unknown>> | undefined)?.[0]
  return {
    [DeviceMetricClaim.Identifier]: (resource.identifier as Array<{ value?: string }> | undefined)?.[0]?.value,
    [DeviceMetricClaim.Type]: codingToValue((resource.type as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0]),
    [DeviceMetricClaim.Unit]: codingToValue((resource.unit as { coding?: Array<{ system?: string; code?: string }> } | undefined)?.coding?.[0]),
    [DeviceMetricClaim.Device]: referenceToValue(resource.device as { reference?: string } | undefined),
    [DeviceMetricClaim.OperationalStatus]: resource.operationalStatus as string | undefined,
    [DeviceMetricClaim.Category]: resource.category as string | undefined,
    [DeviceMetricClaim.CalibrationType]: calibration?.type as string | undefined,
    [DeviceMetricClaim.CalibrationState]: calibration?.state as string | undefined,
    [DeviceMetricClaim.CalibrationTime]: calibration?.time as string | undefined,
  }
}
