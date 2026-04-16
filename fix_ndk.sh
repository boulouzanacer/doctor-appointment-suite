#!/bin/bash

# Script to fix the NDK corruption and clean up the Flutter project
# Run this from your local Mac terminal (NOT inside Trae)

echo "--- 🛠 Fixing Flutter NDK Corruption ---"

NDK_PATH="/Users/macbookair/Library/Android/sdk/ndk/27.0.12077973"

if [ -d "$NDK_PATH" ]; then
    echo "Found corrupted NDK at: $NDK_PATH"
    echo "Deleting... (You might be asked for your Mac password)"
    sudo rm -rf "$NDK_PATH"
    echo "✅ Corrupted NDK deleted."
else
    echo "❌ Corrupted NDK not found at the specific path. It may have already been deleted or is at a different location."
fi

echo "--- 🧹 Cleaning Flutter Project ---"
cd patient_flutter
flutter clean
flutter pub get

echo "--- 🚀 Ready to build ---"
echo "You can now run: cd patient_flutter && flutter run"
