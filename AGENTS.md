# AI Coding Rules

These rules apply to all AI-generated code in this repository, including new
code and existing code that is updated, refactored, or materially modified by
an AI.

## Required AI attribution

Every new or existing function, method, class, component, hook, type,
interface, module-level constant, configuration block, or other code unit
written, updated, refactored, or materially modified by an AI must include an
inline attribution comment using the appropriate tag:

1. New code units must use `Created by AI.`
2. Existing code units updated, refactored, or materially modified by AI must
   use `Updated by AI.`
3. If a code unit already has `Created by AI.`, add `Updated by AI.` on the
   next line when it is subsequently updated by AI.

Use the comment syntax supported by the language. For example:

```ts
// Created by AI.
export function example(): void {
  // implementation
}
```

For Python:

```python
# Created by AI.
def example() -> None:
    pass
```

For an existing code unit that is updated:

```ts
// Created by AI.
// Updated by AI.
export function example(): void {
  // implementation
}
```

For YAML or JSON-like configuration, place the attribution on the nearest
supported comment line. Do not add comments to strict JSON files, because
comments would make them invalid; instead, ask for human guidance before
modifying strict JSON when attribution cannot be represented without breaking
the file.

The attribution must be added to every applicable code unit changed by the AI,
including pre-existing code that is updated or refactored, not only once per
file. Before completing a change, verify that all AI-written, updated,
refactored, or materially modified code has the correct creation/update tag.

Human reviewers must inspect and approve the code before it is considered
ready for integration.

## Required AI usage declaration

Every use of AI in this repository must be declared after the activity is
completed, exclusively in the individual file of the person who made the
change, at `USO_IA/<member>.md`. The declaration must follow the narrative
format of the individual file and include:

- The tool used and its version.
- The purpose and activity stage.
- The type of contribution provided by the AI.
- Confirmation that no personal data was processed.
- Confirmation of critical review and human responsibility for the final
  result.

The record must also include the changed files, a summary of no more than 200
characters, the AI tool used, and the name of the person responsible for the
review. Each activity must have its own record in the individual file: never
replace, delete, or merely update the fields of a previous record. When
recording a new activity, append a new `## Registro da atividade 0000` block at the
end of the file, incrementing the number of the last existing record and
completing all required fields.

If the individual file does not yet exist, create it using the model defined
in the existing individual reference file in `USO_IA/`.
