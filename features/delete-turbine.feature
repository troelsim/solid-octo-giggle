Feature: Delete turbine confirmation

  The Delete button on the turbine editor opens a confirmation popover; the
  turbine is only removed when the user confirms.

  Background:
    Given the app has been started

  Rule: Delete is confirmation-guarded

    Example: Clicking Delete opens the confirmation popover
      Given I have placed a turbine
      Then the delete confirmation popover is not visible
      When I delete the selected turbine
      Then the delete confirmation popover is visible

    Example: The turbine is not removed until the user confirms
      Given I have placed a turbine
      When I delete the selected turbine
      Then there is 1 turbine on the map

    Example: Escape dismisses the popover without deleting
      Given I have placed a turbine
      And I delete the selected turbine
      When I press Escape
      Then the delete confirmation popover is not visible
      And there is 1 turbine on the map

    Example: Selecting another turbine closes the popover
      Given I have placed 2 turbines
      And I select turbine 1
      And I delete the selected turbine
      When I select turbine 2
      Then the delete confirmation popover is not visible
