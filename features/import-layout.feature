Feature: Importing a layout from CSV

  A CSV (same format as the export) can be pasted into the import modal to
  replace the current layout. A confirmation popover guards against
  accidental overwrites.

  Background:
    Given the stored layout is
      """
      {
        "turbines": [{ "id": "t1", "lat": 55, "lng": 7.9, "name": "Old", "custom": null }],
        "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
        "mapView": { "center": [55.5, 7.9], "zoom": 10 }
      }
      """

  Rule: Importing is confirmation-guarded

    Example: Submit opens a confirmation popover
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        """
      And I submit the import
      Then the import confirmation popover is visible

    Example: The layout stays unchanged before confirmation
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        56.2,8.4,Beta,V80-2.0MW
        """
      And I submit the import
      Then there is 1 turbine on the map

    Example: Dismissing the confirmation reverts to the previous state
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        56.2,8.4,Beta,V80-2.0MW
        """
      And I submit the import
      And I dismiss the import confirmation
      Then there is 1 turbine on the map
      And the import confirmation popover is not visible

  Rule: Confirming the import replaces the layout and closes the modal

    Example: Imported turbines replace the existing ones
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        56.2,8.4,Beta,V80-2.0MW
        """
      And I submit the import
      And I confirm the import
      Then there are 2 turbines on the map

    Example: The modal is closed after import
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        """
      And I submit the import
      And I confirm the import
      Then the import modal is not visible

    Example: The app returns to view mode
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        """
      And I submit the import
      And I confirm the import
      Then the current mode is "view"

  Rule: The CSV format mirrors the export — lat, lng, name, optional spec triplet

    Example: Quoted fields preserve latitude, longitude, and name
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        37.759228,128.713727,"21455","V80-2.0MW"
        """
      And I submit the import
      And I confirm the import
      Then the first stored turbine has lat 37.759228, lng 128.713727, name "21455"

    Example: A spec-triplet description becomes a custom spec
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,,150 5000 120
        """
      And I submit the import
      And I confirm the import
      Then the first stored turbine has custom specs rotor diameter 150, rated power 5, hub height 120

    Example: A non-spec description leaves custom null
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,Alpha,V80-2.0MW
        """
      And I submit the import
      And I confirm the import
      Then the first stored turbine has no custom specs

    Example: Multi-line quoted names are supported
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        37.759228,128.713727,"Alpha, Beta
        Gamma",V80-2.0MW
        """
      And I submit the import
      And I confirm the import
      Then the first stored turbine has name "Alpha, Beta\nGamma"

  Rule: Invalid CSV input shows an error and leaves the layout untouched

    Example: Bad coordinates show an error and skip the confirmation
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        notanumber,7.9,A,B
        """
      And I submit the import
      Then the import confirmation popover is not visible
      And an import error is shown

    Example: Unterminated quoted fields produce a parse error
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        55.1,7.9,"Alpha,V80-2.0MW
        """
      And I submit the import
      Then the import confirmation popover is not visible
      And the import error contains "unterminated quoted field"

    Example: A header-only CSV does not change the layout
      When I open the import modal
      And I paste the following CSV
        """
        Latitude,Longitude,Name,Description
        """
      And I submit the import
      Then there is 1 turbine on the map

    Example: The Import button is disabled while the textarea is empty
      When I open the import modal
      Then the import submit button is disabled
