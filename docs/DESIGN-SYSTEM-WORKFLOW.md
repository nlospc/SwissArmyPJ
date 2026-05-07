# Design System Workflow

## Position

Open Design is the exploration tool.

Figma is the canonical design system and screen contract when MCP access is available.

Production implementation follows Figma and repository contracts, not raw Open Design HTML.

## Flow

```text
Open Design exploration
  -> human selects direction
  -> Figma tokens, components, and screens
  -> Codex implementation
  -> Playwright screenshot acceptance
```

## Figma Structure

The canonical Figma file should contain:

- `00 Product Principles`
- `01 Design Tokens`
- `02 Components`
- `03 Workbench Screens`
- `04 Implementation Handoff`
- `05 Open Design References`

## Design Principles

- Desktop-first PM workbench
- Dense but readable operational UI
- Main workspace gets priority over summaries
- Evidence and source links are visible when decisions matter
- AI suggestions are reviewable proposals
- Avoid marketing-style dashboards
- Avoid nested page-layout cards
- Avoid decorative gradients and visual noise

## Implementation Contract

Each UI slice should reference:

- Figma file key
- Figma frame node ID
- target route or component
- viewport size
- required states
- screenshot baseline
- forbidden deviations

## Open Design Usage

Use Open Design for:

- alternative visual styles
- quick screen explorations
- PM Workspace composition ideas
- design language references

Do not use Open Design for:

- production source of truth
- schema design
- direct HTML copy-paste into the app
- replacing Figma acceptance frames
