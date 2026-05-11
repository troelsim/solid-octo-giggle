Feature: Middle-mouse-button map panning

  In add or move mode, left-click is reserved for turbine placement. Desktop
  users can still pan the map by middle-mouse-button dragging without
  accidentally placing a turbine or exiting the current mode.

  Background:
    Given the app has been started

  Rule: Middle-mouse drag pans the map without disturbing the current mode

    Example: Middle-mouse pan in add mode does not place a turbine or change mode
      Given I have placed a turbine
      And the current mode is "add"
      And there is 1 turbine on the map
      When I middle-mouse drag the map
      Then the map view has changed
      And the current mode is "add"
      And there is 1 turbine on the map

    Example: Middle-mouse pan in move mode does not confirm the move
      Given I have placed a turbine
      And I click Move on the selected turbine
      And the current mode is "move"
      When I middle-mouse drag the map
      Then the map view has changed
      And the current mode is "move"
      And there is 1 turbine on the map
