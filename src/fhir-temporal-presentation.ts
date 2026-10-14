export type FhirTemporalRange = Readonly<{
  from?: string
  to?: string
}>

export type LocalDateTimeParts = Readonly<{
  date: string
  time: string
}>

export type ComposeFhirDateTimeInput = LocalDateTimeParts & Readonly<{
  timeZone: string
}>

export type FhirTemporalFormatOptions = Readonly<{
  timeZone?: string
  includeTime?: boolean
  includeSeconds?: boolean
}>

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

/**
 * Formats a FHIR date, dateTime or instant for a human in their locale.
 * Wire values remain unchanged; ISO syntax is never used as presentation.
 */
export function formatFhirTemporalForLocale(
  value: string | Date,
  locale: string,
  options: FhirTemporalFormatOptions = {},
): string {
  const dateOnly = typeof value === 'string' ? DATE_PATTERN.exec(value) : null
  const includeTime = options.includeTime ?? !dateOnly
  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
    : value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new RangeError('FHIR temporal value is invalid')

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: dateOnly ? '2-digit' : 'short',
    day: dateOnly ? '2-digit' : 'numeric',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
    second: includeTime && options.includeSeconds ? '2-digit' : undefined,
    hour12: includeTime ? false : undefined,
    timeZone: dateOnly ? 'UTC' : options.timeZone,
  }).format(date)
}

/** Builds a FHIR instant from separate browser-friendly local date and time fields. */
export function composeFhirDateTimeFromLocalParts(input: ComposeFhirDateTimeInput): string {
  const dateMatch = DATE_PATTERN.exec(input.date)
  const timeMatch = TIME_PATTERN.exec(input.time)
  if (!dateMatch || !timeMatch) throw new RangeError('Use YYYY-MM-DD and HH:mm or HH:mm:ss')

  const expected = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] ?? '00'),
  }
  assertValidCalendarParts(expected)
  assertTimeZone(input.timeZone)

  const expectedUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute, expected.second)
  let candidate = expectedUtc
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = datePartsInTimeZone(new Date(candidate), input.timeZone)
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second)
    candidate += expectedUtc - actualUtc
  }

  const result = new Date(candidate)
  const roundTrip = datePartsInTimeZone(result, input.timeZone)
  if (Object.keys(expected).some((key) => expected[key as keyof typeof expected] !== roundTrip[key as keyof typeof roundTrip])) {
    throw new RangeError('Local date and time do not exist in the selected time zone')
  }
  return result.toISOString()
}

/** Splits a FHIR instant into local inputs without leaking ISO UTC presentation. */
export function splitFhirDateTimeForInput(value: string | Date, timeZone: string): LocalDateTimeParts {
  assertTimeZone(timeZone)
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new RangeError('FHIR temporal value is invalid')
  const parts = datePartsInTimeZone(date, timeZone)
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`,
  }
}

/** Applies an inclusive range; an omitted upper bound means the supplied current instant. */
export function isFhirTemporalWithinRange(value: string | Date, range: FhirTemporalRange, now = new Date()): boolean {
  const instant = value instanceof Date ? value : new Date(value)
  const from = range.from ? new Date(range.from) : undefined
  const to = range.to ? new Date(range.to) : now
  if ([instant, from, to].some((date) => date && Number.isNaN(date.getTime()))) {
    throw new RangeError('FHIR temporal range is invalid')
  }
  return (!from || instant >= from) && instant <= to
}

type NumericDateTimeParts = Readonly<{
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}>

function datePartsInTimeZone(date: Date, timeZone: string): NumericDateTimeParts {
  const values = new Map(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map(({ type, value }) => [type, value]),
  )
  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
    second: Number(values.get('second')),
  }
}

function assertValidCalendarParts(parts: NumericDateTimeParts): void {
  if (parts.hour > 23 || parts.minute > 59 || parts.second > 59) throw new RangeError('Local time is invalid')
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  if (date.getUTCFullYear() !== parts.year || date.getUTCMonth() + 1 !== parts.month || date.getUTCDate() !== parts.day) {
    throw new RangeError('Local date is invalid')
  }
}

function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(0)
  } catch {
    throw new RangeError('IANA time zone is invalid')
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
