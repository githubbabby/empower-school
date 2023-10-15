// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYWNQxcfBAv8Q51D0W59-XPB9tNiRn5ao",
  authDomain: "empower-school.firebaseapp.com",
  projectId: "empower-school",
  storageBucket: "empower-school.appspot.com",
  messagingSenderId: "158379655248",
  appId: "1:158379655248:web:ae7c79d7ce2661ef3ed155",
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
