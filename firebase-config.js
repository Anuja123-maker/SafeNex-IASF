// Firebase Configuration
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDoxwPM0ezw1sDD1aTvzo83QLR8FRsgMWM",
  authDomain: "safenex-88740.firebaseapp.com",
  projectId: "safenex-88740",
  storageBucket: "safenex-88740.firebasestorage.app",
  messagingSenderId: "424949326790",
  appId: "1:424949326790:web:c5b9a718303f47f96148c7",
  measurementId: "G-ZQSN7K26RF"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Realtime Database (optional) - only initialize if compat script is available
let rtdb = null;
if (typeof firebase.database === 'function') {
  rtdb = firebase.database();
} else {
  console.warn('Realtime Database not available. Include firebase-database-compat.js if you need RTDB features.');
}

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
