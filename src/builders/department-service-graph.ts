import { HealthcareServiceClaim } from '../claims/healthcare-service-claims.js'
import { OrganizationClaim } from '../claims/organization-claims.js'

export type ClaimsFirstGraphResource = Readonly<{
  resourceType: 'Organization' | 'HealthcareService'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, string | readonly string[]>> }>
}>

export type DepartmentServiceInput = Readonly<{
  serviceId: string
  serviceIdentifier: string
  name: string
  description?: string
  serviceCategory?: readonly string[]
  serviceType: readonly string[]
  specialty?: readonly string[]
  locationReferences: readonly string[]
}>

export type DepartmentServicesFlatGraphInput = Readonly<{
  departmentId: string
  departmentIdentifier: string
  parentOrganizationReference: string
  name: string
  description?: string
  organizationType?: string
  services: readonly DepartmentServiceInput[]
}>

const required = (value: string, error: string): string => {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}

const resourceId = (value: string): string => {
  const normalized = required(value, 'department_service_id_required')
  if (!/^[A-Za-z0-9.-]{1,64}$/.test(normalized)) throw new TypeError('department_service_id_invalid')
  return normalized
}

const reference = (value: string, prefix: string, error: string): string => {
  const normalized = required(value, error)
  if (!normalized.startsWith(`${prefix}/`) || normalized.length === prefix.length + 1) throw new TypeError(error)
  return normalized
}

const token = (value: string, error: string): string => {
  const normalized = required(value, error)
  const separator = normalized.lastIndexOf('|')
  if (separator < 1 || separator === normalized.length - 1) throw new TypeError(error)
  return normalized
}

const tokenList = (values: readonly string[] | undefined, error: string, requiredList = false): readonly string[] | undefined => {
  const normalized = Object.freeze((values ?? []).map(value => token(value, error)))
  if (requiredList && !normalized.length) throw new TypeError(error)
  return normalized.length ? normalized : undefined
}

const referenceList = (values: readonly string[], prefix: string, error: string): readonly string[] => {
  const normalized = Object.freeze(values.map(value => reference(value, prefix, error)))
  if (!normalized.length) throw new TypeError(error)
  return normalized
}

const compactClaims = (
  claims: Record<string, string | readonly string[] | undefined>,
): Readonly<Record<string, string | readonly string[]>> => Object.freeze(
  Object.fromEntries(Object.entries(claims).filter((entry): entry is [string, string | readonly string[]] => entry[1] !== undefined)),
)

/**
 * Builds one department Organization and one independent HealthcareService
 * row per offered service. Schedule actors can therefore target a blood,
 * plasma or other service independently even when they share a department.
 */
export function buildDepartmentServicesFlatGraph(
  input: DepartmentServicesFlatGraphInput,
): readonly ClaimsFirstGraphResource[] {
  const departmentId = resourceId(input.departmentId)
  const departmentIdentifier = token(input.departmentIdentifier, 'department_service_identifier_invalid')
  const parentOrganizationReference = reference(
    input.parentOrganizationReference,
    'Organization',
    'department_service_parent_reference_invalid',
  )
  const name = required(input.name, 'department_service_name_required')
  const description = input.description?.trim() || undefined
  const organizationType = input.organizationType
    ? token(input.organizationType, 'department_service_organization_type_invalid')
    : undefined
  const departmentReference = `Organization/${departmentId}`
  if (!input.services.length) throw new TypeError('department_services_required')
  const serviceIds = new Set<string>()
  const services = input.services.map(service => {
    const serviceId = resourceId(service.serviceId)
    if (serviceIds.has(serviceId)) throw new TypeError('department_service_id_duplicate')
    serviceIds.add(serviceId)
    const serviceIdentifier = token(service.serviceIdentifier, 'department_service_identifier_invalid')
    const serviceName = required(service.name, 'department_service_name_required')
    const serviceDescription = service.description?.trim() || undefined
    const serviceCategory = tokenList(service.serviceCategory, 'department_service_category_invalid')
    const serviceType = tokenList(service.serviceType, 'department_service_type_invalid', true)!
    const specialty = tokenList(service.specialty, 'department_service_specialty_invalid')
    const locationReferences = referenceList(
      service.locationReferences,
      'Location',
      'department_service_location_reference_invalid',
    )
    return Object.freeze({
      resourceType: 'HealthcareService' as const,
      id: serviceId,
      meta: Object.freeze({ claims: compactClaims({
        [HealthcareServiceClaim.Identifier]: serviceIdentifier,
        [HealthcareServiceClaim.Active]: 'true',
        [HealthcareServiceClaim.Organization]: departmentReference,
        [HealthcareServiceClaim.ServiceCategory]: serviceCategory,
        [HealthcareServiceClaim.ServiceType]: serviceType,
        [HealthcareServiceClaim.Specialty]: specialty,
        [HealthcareServiceClaim.Location]: locationReferences,
        [HealthcareServiceClaim.Name]: serviceName,
        [HealthcareServiceClaim.Comment]: serviceDescription,
      }) }),
    })
  })

  return Object.freeze([
    Object.freeze({
      resourceType: 'Organization' as const,
      id: departmentId,
      meta: Object.freeze({ claims: compactClaims({
        [OrganizationClaim.Identifier]: departmentIdentifier,
        [OrganizationClaim.Active]: 'true',
        [OrganizationClaim.Type]: organizationType,
        [OrganizationClaim.Name]: name,
        [OrganizationClaim.Description]: description,
        [OrganizationClaim.PartOf]: parentOrganizationReference,
      }) }),
    }),
    ...services,
  ])
}
