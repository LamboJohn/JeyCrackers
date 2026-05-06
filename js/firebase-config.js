// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyADMvucfjrz62bSKrrXx8WyszOZPjBMhUc",
  authDomain: "jeycrackers-e9b98.firebaseapp.com",
  projectId: "jeycrackers-e9b98",
  storageBucket: "jeycrackers-e9b98.firebasestorage.app",
  messagingSenderId: "689824423228",
  appId: "1:689824423228:web:f5dd89be7c8021f27e5239",
  measurementId: "G-V82FDWB37W"
};

// Initialize Firebase using compat SDK
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Make them available globally
window.db = db;
window.auth = auth;
window.firebase = firebase;

// --- BEST BALANCED SETUP: ENABLE OFFLINE PERSISTENCE ---
window.db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Multiple tabs open, persistence enabled in only one.");
    } else if (err.code == 'unimplemented') {
      console.warn("Browser doesn't support persistence.");
    }
  });
