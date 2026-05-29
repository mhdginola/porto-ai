"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseConfig } from "@/lib/firebase/config";

let app: FirebaseApp | undefined;
let storage: FirebaseStorage | undefined;

export function getFirebaseApp(): FirebaseApp {
  const config = getFirebaseConfig();
  if (!config) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  }

  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  return app;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
