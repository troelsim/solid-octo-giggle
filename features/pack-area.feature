Feature: Pack a polygon with turbines

  The user draws a polygon on the map and fills it with a hex-packed grid of
  turbines. Spacing = spacingRingDiameters × fleet.rotorDiameter.

  Background:
    Given the app has been started

  Rule: Pack-area mode switches the map into draw mode

    Example: Clicking Pack area enters draw mode
      When I click Pack area
      Then the current mode is "draw"

    Example: The draw banner is shown
      When I click Pack area
      Then the draw banner is visible

    Example: Entering draw mode deselects any selected turbine
      Given I have placed a turbine
      And I press Escape
      And the turbine editor panel is showing
      When I click Pack area
      Then the fleet defaults panel is showing

  Rule: Map clicks add vertices and the Fill button needs at least three

    Example: Each click records a vertex
      Given I click Pack area
      When I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
      Then the polygon has 2 vertices

    Example: Draw mode persists while vertices are being added
      Given I click Pack area
      When I add polygon vertices
        | 55.491 | 7.886 |
      Then the current mode is "draw"

    Example: Fill is disabled with fewer than three vertices, enabled at three
      Given I click Pack area
      When I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
      Then the Fill button is disabled
      When I add polygon vertices
        | 55.509 | 7.914 |
      Then the Fill button is enabled

  Rule: Confirming Fill packs the polygon and returns to view mode

    Example: Turbines are added to the layout
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      Then there are 0 turbines on the map
      When I click Fill
      Then there is at least 1 turbine on the map

    Example: View mode is restored
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      When I click Fill
      Then the current mode is "view"

    Example: The polygon draft is discarded
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      When I click Fill
      Then the polygon has 0 vertices

    Example: The packed turbines are persisted
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      When I click Fill
      Then the stored layout has at least 1 turbine

    Example: A wider spacing-ring multiplier places fewer turbines
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      And I click Fill
      And I remember the current turbine count as "dense"
      And the app is restarted
      And I click the spacing ring toggle
      And I click the spacing ring toggle
      And I set the ring diameters to 6
      And I click Show ring
      And I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      When I click Fill
      Then the turbine count is less than the "dense" count

  Rule: Cancelling discards the draft without touching existing turbines

    Example: Cancel exits draw mode and clears the polygon
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
      When I click Cancel
      Then the current mode is "view"
      And the polygon has 0 vertices

    Example: Escape exits draw mode and clears the polygon
      Given I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
      When I press Escape
      Then the current mode is "view"
      And the polygon has 0 vertices

    Example: Existing turbines are untouched
      Given I have placed a turbine
      And I press Escape
      And I click Pack area
      And I add polygon vertices
        | 55.491 | 7.886 |
        | 55.491 | 7.914 |
        | 55.509 | 7.914 |
        | 55.509 | 7.886 |
      When I click Cancel
      Then there is 1 turbine on the map
