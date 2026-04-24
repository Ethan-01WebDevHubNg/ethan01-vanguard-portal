// public/js/config/firebase-dev.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDAfg787RYAOzpnMxVtMygj2JtaXAOD7ro",
    authDomain: "ethan01-portal.firebaseapp.com",
    projectId: "ethan01-portal",
    storageBucket: "ethan01-portal.firebasestorage.app",
    messagingSenderId: "715302487482",
    appId: "1:715302487482:web:58dc1c4cd89f5b47ef8983"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export core services (Standard initialization, no specific DB binding)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase Environment Initialized.");