import React, { useState } from "react";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, updateDoc } from "firebase/firestore";

export default function Profile() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });
  const { name, email } = formData;
  function onLogOut() {
    try {
      signOut(auth);
      toast.success("Sesion cerrada con exito");
      navigate("/sign-in");
    } catch (error) {
      toast.error(error.message);
    }
  }
  function onChange(e) {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  }
  async function onSubmit() {
    try {
      if (auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        const docRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(docRef, {
          name,
        });
        toast.success("Perfil actualizado con exito");
      } else {
        toast.info("No se ha realizado ningun cambio");
      }
    } catch (error) {
      toast.error(error.message);
    }
  }
  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-col items-center justify-center">
        <h1 className="mt-6 text-center text-3xl font-bold">
          Perfil de Usuario
        </h1>
        <div className="mt-6 w-full px-3 md:w-[50%]">
          <form>
            {/* Name */}
            <input
              type="text"
              id="name"
              value={name}
              disabled={!isEditing}
              onChange={onChange}
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />

            {/* Email */}
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="mb-6 w-full rounded border border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />
            <div className="mb-6 flex justify-between whitespace-nowrap text-sm sm:text-lg">
              <p className="flex items-center">
                Quiere editar su perfil?{" "}
                <span
                  onClick={() => {
                    isEditing && onSubmit();
                    setIsEditing((prevState) => !prevState);
                  }}
                  className="ml-1 text-red-700 transition duration-300 ease-in-out hover:cursor-pointer hover:text-red-900"
                >
                  {isEditing ? "Guardar" : "Editar"}
                </span>
              </p>
              <p
                onClick={onLogOut}
                className="text-blue-700 transition duration-300 ease-in-out hover:cursor-pointer hover:text-blue-900"
              >
                Cerrar sesion
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
