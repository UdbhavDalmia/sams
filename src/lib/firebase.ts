import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBddt-iPvtiG9aTB2ay9MY7VOfaY2vQJKE",
  authDomain: "gen-lang-client-0844479508.firebaseapp.com",
  projectId: "gen-lang-client-0844479508",
  storageBucket: "gen-lang-client-0844479508.firebasestorage.app",
  messagingSenderId: "97371965956",
  appId: "1:97371965956:web:56ab2ae458f65be309c351",
  measurementId: "G-GSR0W5BNKE"
};

// Initialize Firebase Client
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google login popup helper
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
};

// Google logout helper
export const logoutFromGoogle = async () => {
  await signOut(auth);
};
