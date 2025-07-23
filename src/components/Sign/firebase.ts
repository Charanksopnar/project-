// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDsuQqVAckKmalILy9Pgrmar3J5m5SmTkY",
  authDomain: "project-crhs.firebaseapp.com",
  projectId: "project-crhs",
  storageBucket: "project-crhs.firebasestorage.app",
  messagingSenderId: "42511628023",
  appId: "1:42511628023:web:0153225897c606f50d85f2",
  measurementId: "G-2D18H1DE3X"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig): getApp();
const auth = getAuth(app);
auth.useDviceLanguage();

export{ auth };