Feature: Individual turbine specifications

  Each turbine inherits the fleet defaults unless customised. Custom values
  can be reverted back to the fleet defaults.

  Background:
    Given the app has been started

  Rule: A fresh turbine inherits the fleet defaults

    Example: All spec fields match the fleet defaults
      When I place a turbine on the map
      Then turbine 1 has the specs hub height 120 m, rotor diameter 150 m, rated power 5

    Example: A fresh turbine is not flagged as custom
      When I place a turbine on the map
      Then turbine 1 is not flagged as custom

  Rule: Editing any spec marks the turbine as custom and stores the new value

    Example: Editing hub height marks the turbine as custom
      Given I have placed a turbine
      When I set turbine 1's hub height to 140
      Then turbine 1 is flagged as custom

    Example: Editing hub height stores the new value
      Given I have placed a turbine
      When I set turbine 1's hub height to 140
      Then turbine 1 has hub height 140 m

    Example: Editing rotor diameter stores the new value
      Given I have placed a turbine
      When I set turbine 1's rotor diameter to 180
      Then turbine 1 has rotor diameter 180 m

    Example: Editing rated power stores the new value
      Given I have placed a turbine
      When I set turbine 1's rated power to 6.5
      Then turbine 1 has rated power 6.5

    Example: Sibling turbines stay on fleet defaults when one is edited
      Given I have placed 2 turbines
      And I select turbine 1
      When I set turbine 1's hub height to 200
      And I select turbine 2
      Then turbine 2 has hub height 120 m

  Rule: Resetting to fleet defaults removes the override

    Example: The custom badge disappears after a reset
      Given I have placed a turbine
      And I set turbine 1's hub height to 140
      When I reset turbine 1 to the fleet defaults
      Then turbine 1 is not flagged as custom

    Example: The visible values revert to the fleet defaults after a reset
      Given I have placed a turbine
      And I set turbine 1's hub height to 140
      And I set turbine 1's rotor diameter to 200
      When I reset turbine 1 to the fleet defaults
      Then turbine 1 has the specs hub height 120 m, rotor diameter 150 m, rated power 5
