Feature: Local-storage persistence

  Every layout change is written to localStorage; mounting the App reads it
  back so users can pick up where they left off.

  Rule: Layout changes are persisted as they happen

    Example: Adding a turbine is persisted
      Given the app has been started
      When I place a turbine on the map
      Then the stored layout has 1 turbine

    Example: Removing a turbine is persisted
      Given the app has been started
      And I have placed a turbine
      When I delete the selected turbine
      And I confirm the deletion
      Then the stored layout has 0 turbines

    Example: Clearing the layout is persisted
      Given the app has been started
      And I have placed a turbine
      And I deselect the current turbine
      When I click Clear layout
      And I confirm the clear-layout
      Then the stored layout has 0 turbines

    Example: A fleet spec change is persisted
      Given the app has been started
      When I set the fleet hub height to 140
      Then the stored fleet hub height is 140

  Rule: Saved state is restored on mount

    Example: Turbines are restored from a previous session
      Given the stored layout is
        """
        {
          "turbines": [
            { "id": "t1", "lat": 55.5, "lng": 7.9, "custom": null, "name": "" },
            { "id": "t2", "lat": 56.0, "lng": 8.0, "custom": null, "name": "" }
          ],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 2 turbines on the map

    Example: Fleet specs are restored from a previous session
      Given the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 140, "rotorDiameter": 160, "ratedPower": 6 }
        }
        """
      Then the fleet specs are hub height 140, rotor diameter 160, rated power 6

    Example: Empty storage starts with empty defaults
      Given the app has been started
      Then there are 0 turbines on the map
      And the fleet specs are hub height 120, rotor diameter 150, rated power 5

  Rule: Map view is persisted across sessions

    Example: A user pan/zoom is persisted
      Given the app has been started
      When the map view changes
      Then the stored map view is centred on 56.0, 8.5 at zoom 12

    Example: A map view is restored after reload
      Given the app has been started
      And the map view changes
      When the page is reloaded
      Then the map is centred on 56.0, 8.5 at zoom 12

    Example: The default map view is Horns Rev when nothing is saved
      Given the app has been started
      Then the map is centred on 55.5, 7.9 at zoom 10

    Example: A seeded map view from storage is honoured
      Given the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": [57.1, 9.3], "zoom": 8 }
        }
        """
      Then the map is centred on 57.1, 9.3 at zoom 8

  Rule: A page reload preserves everything

    Example: Turbines survive a reload
      Given the app has been started
      And I have placed a turbine
      And I have placed a turbine
      When the page is reloaded
      Then there are 2 turbines on the map

    Example: Fleet specs survive a reload
      Given the app has been started
      And I set the fleet hub height to 140
      When the page is reloaded
      Then the fleet hub height is 140 m

    Example: New turbine IDs do not collide after reload
      Given the app has been started
      And I have placed a turbine
      And I have placed a turbine
      And I have placed a turbine
      When the page is reloaded
      And I place a turbine on the map
      Then the stored turbine IDs are all unique and number 4
