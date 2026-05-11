Feature: Clear layout

  The Clear layout button on the fleet panel wipes every turbine from the
  layout. A confirmation popover guards against accidental clears.

  Background:
    Given the app has been started

  Rule: The Clear layout button only appears when there is something to clear

    Example: No turbines means no Clear layout button
      Then the Clear layout button is not visible

  Rule: Clear layout is confirmation-guarded

    Example: Clicking Clear layout opens the popover
      Given I have placed a turbine
      And I deselect the current turbine
      Then the clear-layout popover is not visible
      When I click Clear layout
      Then the clear-layout popover is visible

    Example: Turbines stay until the user confirms
      Given I have placed 2 turbines
      And I deselect the current turbine
      When I click Clear layout
      Then there are 2 turbines on the map

    Example: Escape dismisses the popover without clearing
      Given I have placed a turbine
      And I deselect the current turbine
      And I click Clear layout
      When I press Escape
      Then the clear-layout popover is not visible
      And there is 1 turbine on the map

    Example: The popover title shows the turbine count
      Given I have placed 3 turbines
      And I deselect the current turbine
      When I click Clear layout
      Then the clear-layout popover title mentions 3 turbines

  Rule: Confirming Clear layout wipes the layout and resets the UI

    Example: Every turbine is removed
      Given I have placed 3 turbines
      And I deselect the current turbine
      When I click Clear layout
      And I confirm the clear-layout
      Then there are 0 turbines on the map

    Example: The fleet defaults panel is shown
      Given I have placed a turbine
      And I deselect the current turbine
      When I click Clear layout
      And I confirm the clear-layout
      Then the fleet defaults panel is showing

    Example: The interaction mode is reset to view
      Given I have placed a turbine
      And I deselect the current turbine
      When I click Clear layout
      And I confirm the clear-layout
      Then the current mode is "view"

    Example: The popover is closed
      Given I have placed a turbine
      And I deselect the current turbine
      When I click Clear layout
      And I confirm the clear-layout
      Then the clear-layout popover is not visible
