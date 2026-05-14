import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADMvucfjrz62bSKrrXx8WyszOZPjBMhUc",
  authDomain: "jeycrackers-e9b98.firebaseapp.com",
  projectId: "jeycrackers-e9b98",
  storageBucket: "jeycrackers-e9b98.firebasestorage.app",
  messagingSenderId: "689824423228",
  appId: "1:689824423228:web:f5dd89be7c8021f27e5239",
  measurementId: "G-SB7TVLB7HY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence for Caching
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence enabled in only one.");
  } else if (err.code == 'unimplemented') {
    console.warn("Browser doesn't support persistence.");
  }
});

// Export for use in other modules
export { db };
window.db_modular = db; // Temporary bridge if needed
