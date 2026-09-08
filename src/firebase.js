import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsiB2z6xAYotxTu2EBtxZlWnqSrvviqQo",
  authDomain: "smartcampuss-app.firebaseapp.com",
  projectId: "smartcampuss-app",
  storageBucket: "smartcampuss-app.firebasestorage.app",
  messagingSenderId: "594628991921",
  appId: "1:594628991921:web:a52a3c1efe6a14d91b7b90",
  measurementId: "G-1W90JWQN8V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};