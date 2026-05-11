Feature: Turbine management

  The lifecycle of individual turbines: adding, selecting, renaming, deleting.

  Background:
    Given the app has been started

  Rule: Placing a turbine adds it to the layout and selects it

    Example: A new turbine is placed on the map
      When I place a turbine on the map
      Then there is 1 turbine on the map

    Example: The new turbine is automatically selected
      When I place a turbine on the map
      Then turbine 1 is selected

    Example: Add mode stays active after a placement
      When I place a turbine on the map
      Then the current mode is "add"

    Example: Sequential placements are numbered
      When I place a turbine on the map
      And I place a turbine on the map
      And I place a turbine on the map
      Then there are 3 turbines on the map

  Rule: Selecting a turbine shows its editor; deselecting shows the fleet panel

    Example: Clicking a marker shows the turbine panel
      Given I have placed 2 turbines
      When I select turbine 2
      Then turbine 2 is selected
      And the turbine editor panel is showing

    Example: Deselecting returns to the fleet panel
      Given I have placed a turbine
      When I deselect the current turbine
      Then the fleet defaults panel is showing

  Rule: Deleting removes the turbine and closes its editor

    Example: A deleted turbine is gone from the map
      Given I have placed a turbine
      When I delete the selected turbine
      And I confirm the deletion
      Then there are 0 turbines on the map

    Example: Deletion closes the editor panel
      Given I have placed a turbine
      When I delete the selected turbine
      And I confirm the deletion
      Then the fleet defaults panel is showing

    Example: Other turbines survive a deletion
      Given I have placed 3 turbines
      And I select turbine 2
      When I delete the selected turbine
      And I confirm the deletion
      Then there are 2 turbines on the map

  Rule: Add mode is sticky and can be exited via Escape or Cancel

    Example: Multiple turbines can be added without re-entering add mode
      When I place a turbine on the map
      And I place a turbine on the map
      And I place a turbine on the map
      Then there are 3 turbines on the map
      And the current mode is "add"

    Example: Escape exits add mode
      Given I have placed a turbine
      When I press Escape
      Then the current mode is "view"

    Example: Cancel exits add mode
      Given I have placed a turbine
      When I click Cancel
      Then the current mode is "view"

  Rule: Renaming a turbine updates both its panel and its map marker

    Example: A renamed turbine shows the custom name in the panel
      Given I have placed a turbine
      When I rename the selected turbine to "Alpha"
      Then the turbine name input shows "Alpha"

    Example: An unnamed turbine falls back to a positional placeholder
      Given I have placed a turbine
      Then the turbine name input is empty with placeholder "Turbine 1"

    Example: The map marker reflects the new name as its aria-label
      Given I have placed a turbine
      When I rename the selected turbine to "Bravo"
      Then turbine 1's marker is labelled "Bravo"
