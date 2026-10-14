# Clinical documents and Encounter exploration

## The two connected graphs

A clinical document is a `Bundle` with `type=document`. Its first resource is
always a `Composition`. The Composition gives the document its human title,
type, authorship, subject and sections. IPS is one document profile; an
emergency note, progress note or diagnostic report uses the same document
shape with a different Composition type and section set.

The care journey is an Encounter graph, not a ResearchSubject graph. The
individual remains the subject of each Encounter. A document associates with
the care step it describes through `Composition.encounter`, and clinical
entries such as Observation or DiagnosticReport may repeat that Encounter
reference when their own FHIR definition provides it.

## Navigation

One parent Encounter can represent the admission or overall episode represented
inside the current provider. Emergency, imaging, surgery, ward and intensive
care steps can be independent child Encounters linked with `Encounter.partOf`.
Their actual periods provide a deterministic chronological order for previous
and next navigation. `EncounterHistory` records status/class/location
milestones for one Encounter; it does not replace the Encounter hierarchy.

The reusable viewer receives authorized documents and Encounters. Selecting an
Encounter shows documents whose `Composition.encounter` references it. Opening
one of those documents renders its Composition sections with the same reader
used for IPS. Missing permissions remain missing data; the browser must not
infer or fetch another subject merely because two Encounter references are
related.

## Write boundaries

- A multi-section attested clinical document is Composition-first.
- A single-section native update may be sent independently and carries its
  section at the Communication boundary.
- Encounter, EncounterHistory, Composition and each clinical entry remain
  independently persisted claims-first resources.
- Authorization, audit and provider persistence belong to the BFF/GW; the
  shared fixture and viewer grant no access.
