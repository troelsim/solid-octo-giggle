Feature: Schema validation for persisted layout

  Corrupt or schema-invalid data in localStorage is silently discarded so the
  app falls back to empty defaults rather than crashing or loading inconsistent
  state.

  Rule: Unparseable JSON falls back to empty defaults

    Example: A malformed JSON literal
      Given the storage contains the raw string "{not valid json"
      Then there are 0 turbines on the map
      And the fleet specs are hub height 120, rotor diameter 150, rated power 5

    Example: A plain string in storage
      Given the storage contains the raw string "hello"
      Then there are 0 turbines on the map
      And the fleet specs are hub height 120, rotor diameter 150, rated power 5

  Rule: Schema-invalid data (valid JSON, wrong shape) is rejected

    Example: turbines as a string instead of an array
      Given the stored layout is
        """
        { "turbines": "not-an-array", "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 } }
        """
      Then there are 0 turbines on the map
      And the fleet specs are hub height 120, rotor diameter 150, rated power 5

    Example: A non-numeric lat invalidates the whole layout
      Given the stored layout is
        """
        {
          "turbines": [{ "id": "t1", "lat": "bad", "lng": 7.9, "name": "", "custom": null }],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 0 turbines on the map

    Example: A null lng invalidates the whole layout
      Given the stored layout is
        """
        {
          "turbines": [{ "id": "t1", "lat": 55.5, "lng": null, "name": "", "custom": null }],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 0 turbines on the map

    Example: A missing id invalidates the whole layout
      Given the stored layout is
        """
        {
          "turbines": [{ "lat": 55.5, "lng": 7.9, "name": "", "custom": null }],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 0 turbines on the map

    Example: A fleet missing a required field falls back to defaults
      Given the stored layout is
        """
        { "turbines": [], "fleet": { "hubHeight": 120, "rotorDiameter": 150 } }
        """
      Then the fleet specs are hub height 120, rotor diameter 150, rated power 5

    Example: A zero fleet value falls back to defaults
      Given the stored layout is
        """
        { "turbines": [], "fleet": { "hubHeight": 0, "rotorDiameter": 150, "ratedPower": 5 } }
        """
      Then the fleet specs are hub height 120, rotor diameter 150, rated power 5

    Example: A negative fleet value falls back to defaults
      Given the stored layout is
        """
        { "turbines": [], "fleet": { "hubHeight": -10, "rotorDiameter": 150, "ratedPower": 5 } }
        """
      Then the fleet specs are hub height 120, rotor diameter 150, rated power 5

    Example: A negative custom spec invalidates the whole layout
      Given the stored layout is
        """
        {
          "turbines": [{
            "id": "t1", "lat": 55.5, "lng": 7.9, "name": "T1",
            "custom": { "hubHeight": -5, "rotorDiameter": 150, "ratedPower": 5 }
          }],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 0 turbines on the map

    Example: A non-pair mapView center is ignored
      Given the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": "not-an-array", "zoom": 10 }
        }
        """
      Then the map is centred on 55.5, 7.9 at zoom 10

  Rule: Valid data still loads correctly

    Example: A valid stored layout loads its turbines
      Given the stored layout is
        """
        {
          "turbines": [
            { "id": "t1", "lat": 55.5, "lng": 7.9, "custom": null, "name": "Alpha" },
            { "id": "t2", "lat": 56.0, "lng": 8.0, "custom": null, "name": "Beta" }
          ],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 }
        }
        """
      Then there are 2 turbines on the map

    Example: A valid custom fleet spec loads
      Given the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 140, "rotorDiameter": 160, "ratedPower": 6 }
        }
        """
      Then the fleet specs are hub height 140, rotor diameter 160, rated power 6

    Example: A valid mapView loads
      Given the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": [57.1, 9.3], "zoom": 8 }
        }
        """
      Then the map is centred on 57.1, 9.3 at zoom 8

    Example: A layout without mapView still loads (backwards compat)
      Given the stored layout is
        """
        { "turbines": [], "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 } }
        """
      Then the map is centred on 55.5, 7.9 at zoom 10
