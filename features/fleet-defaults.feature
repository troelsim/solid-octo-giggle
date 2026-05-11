Feature: Fleet-wide defaults

  The fleet panel sets spec defaults for all turbines that haven't been
  individually customised. A turbine's custom specs can also be promoted to
  become the new fleet defaults, resetting every other turbine in one step.

  Background:
    Given the app has been started

  Rule: The fleet panel is shown when no turbine is selected

    Example: A freshly started app shows the fleet panel
      Then the fleet defaults panel is showing

  Rule: Fleet changes propagate only to non-custom turbines

    Example: Updated fleet hub height applies to inheriting turbines
      Given I have placed a turbine
      And I deselect the current turbine
      When I set the fleet hub height to 100
      And I place a turbine on the map
      Then the selected turbine has hub height 100 m

    Example: A custom turbine ignores fleet changes
      Given I have placed a turbine
      And I set turbine 1's hub height to 200
      And I deselect the current turbine
      When I set the fleet hub height to 100
      And I select turbine 1
      Then the selected turbine has hub height 200 m

  Rule: Promoting a turbine's specs makes them the new fleet defaults

    Example: The fleet adopts the promoted hub height
      Given I have placed a turbine
      And I set turbine 1's hub height to 160
      When I apply turbine 1's specs to the whole fleet
      And I deselect the current turbine
      Then the fleet hub height is 160 m

    Example: The source turbine loses its custom badge
      Given I have placed 2 turbines
      And I select turbine 1
      And I set turbine 1's hub height to 160
      When I apply turbine 1's specs to the whole fleet
      Then turbine 1 is not flagged as custom

    Example: Sibling turbines adopt the promoted value
      Given I have placed 2 turbines
      And I select turbine 1
      And I set turbine 1's hub height to 160
      When I apply turbine 1's specs to the whole fleet
      And I select turbine 2
      Then the selected turbine has hub height 160 m

  Rule: Applying fleet defaults from the fleet panel clears all overrides

    Example: A previously custom turbine reverts to the fleet defaults
      Given I have placed 2 turbines
      And I select turbine 1
      And I set turbine 1's hub height to 200
      And I deselect the current turbine
      When I apply the fleet specs to all turbines
      And I select turbine 1
      Then turbine 1 is not flagged as custom
