import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  function onChange(e) {
    setEmail(e.target.value);
  }
  async function onSubmit(e) {
    e.preventDefault();
    try {
      const auth = getAuth();
      auth.languageCode = "es";
      await sendPasswordResetEmail(auth, email);
      toast.warning(
        "Si existe una cuenta con ese correo, se enviará un correo de recuperación de contraseña. Por favor revise su bandeja de entrada."
      );
    } catch (error) {
      toast.error(error.message);
    }
  }
  return (
    <section>
      <h1 className="mt-6 text-center text-3xl font-extrabold">
        ¿Olvidó su contraseña?
      </h1>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-6 py-11">
        <div className="mb-12 md:mb-6 md:w-[67%] lg:w-[50%]">
          <img
            src="https://images.unsplash.com/photo-1616593437252-0631aeb95590?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="password"
            className="w-full rounded-lg shadow-2xl"
          />
        </div>
        <div className="w-full md:w-[67%] lg:ml-20 lg:w-[40%]">
          <form onSubmit={onSubmit}>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Email"
              className="mb-6 w-full rounded border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />

            <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg">
              <p></p>
              <p className="mb-6">
                <Link
                  to="/sign-in"
                  className="transition duration-200 ease-in-out hover:text-blue-600 hover:underline"
                >
                  Ir a Iniciar sesión
                </Link>
              </p>
            </div>
            <button
              className="w-full rounded bg-red-600 px-4 py-2 font-medium uppercase text-white shadow-lg transition duration-200 ease-in-out hover:bg-red-700 hover:shadow-xl active:bg-red-900"
              type="submit"
            >
              Enviar correo de recuperación de contraseña
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
