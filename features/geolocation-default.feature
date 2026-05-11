Feature: Map defaults to the user's location

  On first visit the App requests browser geolocation and centres the map on
  the user. Denials or missing API fall back to Horns Rev. A saved layout
  takes precedence over geolocation and suppresses the prompt.

  Rule: First-visit geolocation centres and persists the map view

    Example: Successful geolocation centres on the user's coordinates
      Given the browser geolocation resolves to latitude 40.7128, longitude -74.006
      When the app has been started
      Then the map is centred on 40.7128, -74.006 at zoom 10

    Example: The geolocated position is persisted to storage
      Given the browser geolocation resolves to latitude 48.8566, longitude 2.3522
      When the app has been started
      Then the stored map view is centred on 48.8566, 2.3522 at zoom 10

  Rule: Geolocation failures fall back to Horns Rev

    Example: User denies the geolocation prompt
      Given the browser geolocation is denied
      When the app has been started
      Then the map is centred on 55.5, 7.9 at zoom 10

    Example: Geolocation API is unavailable
      Given the browser has no geolocation API
      When the app has been started
      Then the map is centred on 55.5, 7.9 at zoom 10

  Rule: A saved layout suppresses the geolocation prompt

    Example: The stored map view takes precedence and geolocation is not called
      Given the browser geolocation resolves to latitude 40.7128, longitude -74.006
      And the stored layout is
        """
        {
          "turbines": [],
          "fleet": { "hubHeight": 120, "rotorDiameter": 150, "ratedPower": 5 },
          "mapView": { "center": [57.1, 9.3], "zoom": 8 }
        }
        """
      Then the browser geolocation was not requested
      And the map is centred on 57.1, 9.3 at zoom 8
