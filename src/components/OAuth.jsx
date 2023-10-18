import React from "react";
import { FcGoogle } from "react-icons/fc";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function OAuth() {
  const navigate = useNavigate();
  async function onGoogleClick() {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // check if user uid is in the "users" collection, if not, add it
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
        navigate("/");
      } else {
        toast.error("User already exists.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <button
      type="button"
      onClick={onGoogleClick}
      className="flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 font-medium uppercase text-white shadow-lg transition duration-200 ease-in-out hover:bg-blue-700 hover:shadow-xl active:bg-blue-900"
    >
      <FcGoogle className="mr-2 rounded-full bg-white text-2xl" />
      Continue with Google
    </button>
  );
}
