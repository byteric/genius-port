import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXEDl6ZTHAztEShOaJMl4PhwJ2SWCKGKc",
  authDomain: "genius-port.firebaseapp.com",
  projectId: "genius-port",
  storageBucket: "genius-port.firebasestorage.app",
  messagingSenderId: "393549072592",
  appId: "1:393549072592:web:43c72c2fd68c691868b6d5",
  measurementId: "G-EVNM02JXJ3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);