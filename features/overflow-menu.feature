Feature: Mobile header overflow menu

  On mobile the top bar doesn't have room for every action, so Export and
  Import collapse behind a single "More actions" button that opens a menu.
  Desktop keeps them inline.

  Rule: The overflow menu hides Export and Import on mobile

    Background:
      Given the app has been started

    Example: The More-actions trigger is rendered
      Then the More-actions trigger is visible

    Example: Export and Import are hidden until the menu opens
      Then the Export CSV button is not visible
      And the Import CSV button is not visible

    Example: Export and Import are exposed once the menu opens
      When I open the overflow menu
      Then the Export CSV button is visible
      And the Import CSV button is visible

    Example: Export is disabled when there are no turbines
      When I open the overflow menu
      Then the Export CSV button is disabled

    Example: Export is enabled once at least one turbine exists
      Given I have placed a turbine
      And I press Escape
      When I open the overflow menu
      Then the Export CSV button is enabled

    Example: The trigger remains available during draw mode
      When I click Pack area
      Then the More-actions trigger is visible

  Rule: Desktop keeps Export and Import inline

    Example: The trigger is hidden and Export/Import are visible inline
      Given the viewport is desktop
      And the app has been started
      Then the More-actions trigger is not visible
      And the Export CSV button is visible
      And the Import CSV button is visible
