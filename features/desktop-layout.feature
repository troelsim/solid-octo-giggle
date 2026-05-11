Feature: Desktop layout

  At viewports ≥640 px the bottom panel is replaced with a floating turbine
  popover that follows the selected marker, and fleet defaults are tucked
  away behind a settings gear in the header.

  Background:
    Given the viewport is desktop
    And the app has been started

  Rule: Fleet defaults are hidden behind a settings gear on desktop

    Example: The settings gear is rendered
      Then the fleet settings gear is visible

    Example: The settings popover is closed by default
      Then the fleet defaults popover is not visible

    Example: The gear opens the settings popover
      When I open the fleet settings
      Then the fleet defaults popover is visible

    Example: The popover exposes the spec fields
      When I open the fleet settings
      Then the "Hub height" label is visible
      And the "Rotor dia." label is visible
      And the "Power" label is visible

    Example: Fleet specs can be edited from the popover
      When I open the fleet settings
      And I set the fleet hub height to 145
      Then the fleet hub height is 145 m

    Example: Clicking the gear again closes the popover
      Given I open the fleet settings
      When I close the fleet settings
      Then the fleet defaults popover is not visible

    Example: The gear is not rendered on mobile
      Given the viewport is mobile
      And the app is restarted
      Then the fleet settings gear is not visible

  Rule: The settings popover offers Apply-to-all and Clear layout when turbines exist

    Example: Apply-to-all is offered
      Given I have placed a turbine
      When I open the fleet settings
      Then the Apply-to-all button is visible

    Example: Clear layout is offered
      Given I have placed a turbine
      When I open the fleet settings
      Then the Clear layout button is visible

    Example: Clear layout from the popover wipes the layout
      Given I have placed a turbine
      And I open the fleet settings
      When I click Clear layout
      And I confirm the clear-layout
      Then there are 0 turbines on the map

  Rule: The selected turbine renders in a floating popover, not the bottom panel

    Example: The turbine popover appears on selection
      Given I have placed a turbine
      When I press Escape
      Then the turbine editor panel is showing
      And the turbine name input is visible

    Example: The popover shows the spec fields
      Given I have placed a turbine
      When I press Escape
      Then the "Hub height" label is visible
      And the "Rotor dia." label is visible
      And the "Power" label is visible

    Example: The popover has Move and Delete buttons
      Given I have placed a turbine
      When I press Escape
      Then the editor Move button is visible
      And the editor Delete button is visible

    Example: Editing specs via the popover stores them and marks custom
      Given I have placed a turbine
      And I press Escape
      When I set turbine 1's hub height to 130
      Then turbine 1 has hub height 130 m
      And turbine 1 is flagged as custom

    Example: Deselect closes the turbine popover
      Given I have placed a turbine
      And I press Escape
      When I deselect the current turbine
      Then the fleet defaults panel is showing
      And the turbine name input is not visible

    Example: Delete confirmation works from the popover
      Given I have placed a turbine
      And I press Escape
      When I delete the selected turbine
      Then the delete confirmation popover is visible
      When I confirm the deletion
      Then there are 0 turbines on the map

    Example: The mobile bottom panel is not rendered
      Then the mobile bottom panel is not rendered

    Example: The turbine popover is suppressed in add mode
      Given I have placed a turbine
      Then the current mode is "add"
      And the turbine name input is not visible

    Example: The turbine popover is suppressed in move mode
      Given I have placed a turbine
      And I press Escape
      When I click Move on the selected turbine
      Then the turbine name input is not visible
