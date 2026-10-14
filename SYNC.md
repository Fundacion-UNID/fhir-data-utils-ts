# FHIR data contract synchronization

`fhir-data-utils-ts` is the neutral foundation for standards-based FHIR data
contracts. It owns SearchParameter-backed flat claim names, resource-graph
links, narrative source claims and explicit R4/R5/R6 projection helpers. It has
no network clients and no dependency on downstream packages.

```text
FHIR standards
      ↓
fhir-data-utils-ts
      ↓
downstream consumers
```

Downstream consumers may depend on this package. This package never inventories,
names or depends on them. Frozen compatibility packages may import and re-export
these neutral helpers without changing this ownership direction.

For every resource graph:

- each resource is an independent entry with an internal `entryId`;
- only the parent stores a comma-separated
  `<ResourceType>.contained-reference-list`;
- children never store `is-contained` or `contained-parent-reference`;
- language and narrative use `<ResourceType>.language`,
  `<ResourceType>.narrative-status` and `<ResourceType>.xhtml`;
- every PDF/JPEG/PNG is one DocumentReference entry linked from its parent;
- native FHIR R4/R5/R6 exists only at import/export projection boundaries.

For composite Observation graphs:

- the primary entry owns `Observation.has-member` references;
- reduced member Observations use ordinary code and quantity claims and omit
  `Observation.status`;
- no component uses generic containment claims or links;
- R4/R5 projection rebuilds one native `Observation.component[]`;
- historical array and scalar aliases are read-only migration inputs.

For imported terminology review, source wording remains in the canonical
resource-local `*-text` claim, proposals remain beside that resource's
`meta.claims`, and confirmation writes the coded target plus authoritative
display without replacing source text. Consumers import these neutral helpers
and package-owned fixtures without forking the contract.

Release order is indivisible: local tarballs, complete local tests, merge and
push the validated branch to `main`, publish, install exact registry versions
downstream, then promote environments. Never commit a `file:`, Git, workspace
or vendored dependency.
