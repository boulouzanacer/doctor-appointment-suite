# Patient Mobile App (Flutter)

This app allows patients to check their queue position in real-time by scanning a QR code.

## Features
- QR Code Scanning (Patient ID)
- Real-time queue status updates via Firebase Firestore.

## Firebase Setup (Mandatory)
To make real-time updates work, you must set up a Firebase project:

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project named `Doctor Appointment`.
3.  Enable **Firestore Database**.
4.  Add an **Android** and **iOS** app to your Firebase project.
5.  Download the `google-services.json` (for Android) and `GoogleService-Info.plist` (for iOS).
6.  Place `google-services.json` in `android/app/`.
7.  Place `GoogleService-Info.plist` in `ios/Runner/`.
8.  Run `flutterfire configure` if you have the CLI, or follow manual setup.

## React Admin Sync
The React Admin dashboard is also configured to sync with this Firebase project. 
**Make sure to update `src/client/firebase.js` with your Firebase credentials!**

## Development
```bash
flutter pub get
flutter run
```
