# Clinical Typed Accessor Boundary

This package owns the FHIR-neutral claim and projection layer. It does not own
the mutable SDK `BundleReader` / `BundleEditor` session API.

The clinical fields required by the current GDC typed editors are already
canonical here and survive the native FHIR R4 boundary:

| Clinical field | Canonical flat claim | Native FHIR R4 projection |
|---|---|---|
| Observed allergy reaction severity | `AllergyIntolerance.severity` | `AllergyIntolerance.reaction[].severity` |
| Medication treatment end | `MedicationStatement.effective-period-end` | `MedicationStatement.effectivePeriod.end` |
| Immunization administration route | `Immunization.route` | `Immunization.route` |
| Immunization administration site | `Immunization.site` | `Immunization.site` |
| Observation reference-range text | `Observation.reference-range-text` | `Observation.referenceRange[].text` |

`fhir-data-utils-ts` therefore must preserve these fields in claim catalogs,
FHIR converters and resource graphs. It must not copy the GDC SDK's mutable
editor classes or transport-aware Bundle session behavior.

The layer split is:

```text
fhir-data-utils-ts
  canonical claims + R4/R5/R6 import/export
        ↓
downstream libraries
  multichannel schemas, mutable editors, orchestration and product policy
```

When a downstream application adds a visual, chat or telephone editor for one
of these fields, it must consume the canonical claim key from this package. It
must not maintain a second literal, converter or incompatible getter/setter
model.

The mutable GDC Bundle API remains documented separately in
[`gdc-common-utils-ts`](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CLINICAL-ENTRY-GETTERS-SETTERS.md)
and exposed to Node applications by
[`gdc-sdk-node-ts`](https://github.com/Global-DataCare/gdc-sdk-node-ts/blob/main/docs/101-CLINICAL-ENTRY-GETTERS-SETTERS.md).
