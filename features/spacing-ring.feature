Feature: Turbine spacing ring

  The spacing ring overlay visualises a configurable exclusion radius around
  each turbine. It is on by default at 2 rotor diameters. Clicking the toggle
  turns it off immediately; clicking again while off opens a popover to
  configure and re-enable it.

  Background:
    Given the app has been started

  Rule: The spacing ring is on by default at 2 rotor diameters

    Example: The ring is enabled out of the box
      Then the spacing ring is enabled

    Example: The default multiplier is 2
      Then the spacing ring uses 2 rotor diameters

  Rule: Clicking the toggle while the ring is on turns it off immediately

    Example: The ring hides on click
      When I click the spacing ring toggle
      Then the spacing ring is not enabled

    Example: Turning off does not open the popover
      When I click the spacing ring toggle
      Then the spacing ring popover is not visible

  Rule: Clicking the toggle while off opens a configuration popover

    Example: The popover appears
      Given I have clicked the spacing ring toggle
      When I click the spacing ring toggle
      Then the spacing ring popover is visible

    Example: Opening the popover does not yet re-enable the ring
      Given I have clicked the spacing ring toggle
      When I click the spacing ring toggle
      Then the spacing ring is not enabled

    Example: Show ring enables the ring and closes the popover
      Given I have clicked the spacing ring toggle
      And I click the spacing ring toggle
      When I click Show ring
      Then the spacing ring is enabled
      And the spacing ring popover is not visible

    Example: The chosen multiplier is passed to the map
      Given I have clicked the spacing ring toggle
      And I click the spacing ring toggle
      When I set the ring diameters to 5
      And I click Show ring
      Then the spacing ring uses 5 rotor diameters

  Rule: Dismissing the popover (without confirming) leaves the ring off

    Example: A third click closes the popover
      Given I have clicked the spacing ring toggle
      And I click the spacing ring toggle
      When I click the spacing ring toggle
      Then the spacing ring popover is not visible

    Example: A dismissed popover leaves the ring disabled
      Given I have clicked the spacing ring toggle
      And I click the spacing ring toggle
      When I click the spacing ring toggle
      Then the spacing ring is not enabled
