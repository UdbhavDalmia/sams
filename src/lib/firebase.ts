import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBi7n9b7RjOOFv2OrUHxix5IKQmgFhvyh4",
  authDomain: "gen-lang-client-0844479508.firebaseapp.com",
  projectId: "gen-lang-client-0844479508",
  storageBucket: "gen-lang-client-0844479508.firebasestorage.app",
  messagingSenderId: "1011520905225",
  appId: "1:1011520905225:web:aafa46c7d4f139e81098d8"
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
