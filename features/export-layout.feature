Feature: Exporting the layout as CSV

  The fleet panel exposes an "Export CSV" action that emits a copyable CSV
  of every turbine in the layout.

  Rule: The export uses Latitude,Longitude,Name,Description with specs in the description

    Example: Special characters in names are quoted to keep the CSV valid
      Given the stored layout is
        """
        {
          "turbines": [
            { "id": "t1", "lat": 55.1234, "lng": 7.9876, "name": "Alpha, \"Beta\"\nGamma", "custom": null }
          ],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": [55.5, 7.9], "zoom": 10 }
        }
        """
      When I export the layout as CSV
      Then the exported CSV is
        """
        Latitude,Longitude,Name,Description
        55.1234,7.9876,"Alpha, ""Beta""
        Gamma",150 5000 120
        """

    Example: Custom and inherited specs are both included, blank names fall back to "Turbine N"
      Given the stored layout is
        """
        {
          "turbines": [
            { "id": "t1", "lat": 55.1234, "lng": 7.9876, "name": "Alpha", "custom": null },
            { "id": "t2", "lat": 56.2,    "lng": 8.4,    "name": "",      "custom": { "hubHeight": 140, "rotorDiameter": 165, "ratedPower": 6.3 } }
          ],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": [55.5, 7.9], "zoom": 10 }
        }
        """
      When I export the layout as CSV
      Then the exported CSV is
        """
        Latitude,Longitude,Name,Description
        55.1234,7.9876,Alpha,150 5000 120
        56.2,8.4,Turbine 2,165 6300 140
        """
      And the exported CSV text is fully selected
