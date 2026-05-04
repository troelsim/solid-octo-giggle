################################################################################
# This feature file is the literal output of an Example Mapping session
# (Matt Wynne / Seb Rose, "Discovery").
#
#   ┌─────── yellow card (the user story) ───────┐
#   │  Feature: Customising turbine specs        │
#   └────────────────────────────────────────────┘
#                       │
#       ┌───────────────┼────────────────┬──────────────────┐
#       ▼               ▼                ▼                  ▼
#   ┌────────┐    ┌────────┐       ┌────────┐         ┌────────┐
#   │ blue   │    │ blue   │       │ blue   │         │ blue   │
#   │ Rule 1 │    │ Rule 2 │       │ Rule 3 │         │ Rule 4 │
#   └────────┘    └────────┘       └────────┘         └────────┘
#       │             │                │                  │
#     green         green            green              green
#    Examples      Examples         Examples           Examples
#
# Open questions surfaced during the conversation but deferred for a later
# slice are kept as `# QUESTION:` comments next to the relevant rule, so
# the red cards from the workshop don't get lost.
################################################################################

@example-mapping @customising-specs @epic:Discovery-and-BDD
Feature: Customising turbine specs

  As a wind farm planner
  I want to override the standard turbine model on individual sites
  So that I can model heterogeneous fleets where one or two pads differ
  from the rest

  Background:
    Given the fleet defaults are
      | hub height     | 120 |
      | rotor diameter | 150 |
      | rated power    |   5 |

  # ─── BLUE CARD #1 ────────────────────────────────────────────────────────
  @story:Rule-1-Inheritance
  Rule: A turbine inherits the current fleet defaults until it is customised

    Example: A freshly placed turbine shows the fleet specs
      When I place a turbine on the map
      Then turbine 1 has hub height 120 m
      And turbine 1 has rotor diameter 150 m
      And turbine 1 is not flagged as custom

    Example: An uncustomised turbine follows fleet changes
      Given I have placed a turbine
      When the planner changes the fleet hub height to 95
      Then turbine 1 has hub height 95 m

  # ─── BLUE CARD #2 ────────────────────────────────────────────────────────
  # QUESTION (red card, deferred):
  #   Should editing a spec back to the fleet value implicitly clear "custom"?
  #   Decision: NO for now — editing is always an explicit override.
  @story:Rule-2-Override-decouples
  Rule: Editing any spec on a turbine marks it as custom and decouples it from the fleet

    Example: Overriding hub height shows the custom badge
      Given I have placed a turbine
      When I set turbine 1's hub height to 140
      Then turbine 1 is flagged as custom
      And turbine 1 has hub height 140 m

    Example: A custom turbine ignores subsequent fleet changes
      Given I have placed a turbine
      And I set turbine 1's hub height to 140
      When the planner changes the fleet hub height to 80
      Then turbine 1 still has hub height 140 m

    Example: Sibling turbines stay on fleet defaults when one is customised
      Given I have placed 2 turbines
      When I set turbine 1's hub height to 140
      Then turbine 1 is flagged as custom
      And turbine 2 is not flagged as custom
      And turbine 2 has hub height 120 m

  # ─── BLUE CARD #3 ────────────────────────────────────────────────────────
  @story:Rule-3-Reset-to-fleet
  Rule: "Reset to fleet" removes the override and restores inheritance

    Example: A reset turbine follows fleet changes again
      Given I have placed a turbine
      And I set turbine 1's hub height to 140
      When I reset turbine 1 to the fleet defaults
      Then turbine 1 is not flagged as custom
      And turbine 1 has hub height 120 m

  # ─── BLUE CARD #4 ────────────────────────────────────────────────────────
  # QUESTION (red card, deferred):
  #   What happens to OTHER turbines that were already customised when we
  #   "Apply to all"?  Decision for this slice: their custom flag is cleared
  #   too — promotion is destructive by design.  Revisit if users complain.
  @story:Rule-4-Promote-to-fleet
  Rule: "Apply to all turbines" promotes the selected turbine's specs fleet-wide

    Example: Promoting a custom turbine updates the fleet defaults
      Given I have placed a turbine
      And I set turbine 1's hub height to 160
      When I apply turbine 1's specs to the whole fleet
      Then the fleet hub height is 160 m
      And turbine 1 is not flagged as custom

    Example: Promoting clears overrides on every other turbine
      Given I have placed 2 turbines
      And I set turbine 1's hub height to 160
      When I apply turbine 1's specs to the whole fleet
      Then turbine 2 has hub height 160 m
      And turbine 2 is not flagged as custom
