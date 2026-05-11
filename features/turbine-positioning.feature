Feature: Turbine positioning

  A turbine's location can be changed after it has been placed via a two-step
  "move mode": select a turbine, tap Move, then tap (or drag on mobile) the
  map to confirm the new position.

  Background:
    Given the app has been started

  Rule: Move mode toggles between view and move

    Example: Clicking Move enters move mode
      Given I have placed a turbine
      When I click Move on the selected turbine
      Then the current mode is "move"

    Example: Confirming the move returns to view mode
      Given I have placed a turbine
      And I click Move on the selected turbine
      When I tap the map to confirm the move
      Then the current mode is "view"

    Example: The turbine remains on the map after a confirmed move
      Given I have placed a turbine
      And I click Move on the selected turbine
      When I tap the map to confirm the move
      Then there is 1 turbine on the map

    Example: Cancel returns to view mode without removing the turbine
      Given I have placed a turbine
      And I click Move on the selected turbine
      When I click Cancel
      Then the current mode is "view"
      And there is 1 turbine on the map

  Rule: On mobile, the editor panel hides during move mode so the map is fully accessible

    Example: The Move and Delete buttons are hidden during a move
      Given I have placed a turbine
      Then the editor Move button is visible
      When I click Move on the selected turbine
      Then the editor Move button is not visible
      And the editor Delete button is not visible

    Example: A drag-to-move banner is shown during move mode
      Given I have placed a turbine
      When I click Move on the selected turbine
      Then the move banner is visible

    Example: The editor panel is restored after a confirmed move
      Given I have placed a turbine
      And I click Move on the selected turbine
      When I tap the map to confirm the move
      Then the editor Move button is visible

    Example: The editor panel is restored after a cancelled move
      Given I have placed a turbine
      And I click Move on the selected turbine
      When I click Cancel
      Then the editor Move button is visible
