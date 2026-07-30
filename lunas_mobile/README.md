# lunas_mobile

A new Flutter project.

## Google Maps setup

The reusable map picker is available at `/reports/location` and is integrated
into the Create Report flow.

Before running maps, provide restricted API keys:

- Android: set `MAPS_API_KEY=your_key` in
  `%USERPROFILE%/.gradle/gradle.properties`, or set the
  `GOOGLE_MAPS_API_KEY` environment variable. Enable **Maps SDK for Android**.
- Web: replace `YOUR_WEB_GOOGLE_MAPS_API_KEY` in `web/index.html`. Enable
  **Maps JavaScript API** and restrict the key by HTTP referrer.

Do not commit production API keys. Location access on Flutter Web requires a
secure context (`https://` or `localhost`). Android reverse geocoding uses the
device geocoder through the `geocoding` package; browsers that do not expose a
native geocoder display the selected coordinates as the address fallback.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
