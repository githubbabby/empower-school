import React, { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const auth = getAuth();
  const navigate = useNavigate();
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
              disabled
              className="mb-6 w-full rounded border border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out hover:cursor-not-allowed"
            />

            {/* Email */}
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="mb-6 w-full rounded border border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out hover:cursor-not-allowed"
            />
            <div className="mb-6 flex justify-between whitespace-nowrap text-sm sm:text-lg">
              <p className="flex items-center">
                Quiere cambiar su nombre?{" "}
                <span className="ml-1 text-red-700 transition duration-300 ease-in-out hover:cursor-pointer hover:text-red-900">
                  Editar
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
