import { useState } from "react";
import { Link } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db } from "../firebase.config";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "donor", // Default role is 'donor'
  });
  const { nombre, email, password, role } = formData;
  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const navigate = useNavigate();

  function onChange(e) {
    // I dont think this if is really necesary, the role value will be updated anyway in second setFormData
    if (e.target.type === "radio") {
      // If the change event is from a radio button, update the role in the form data.
      setFormData((prevState) => ({
        ...prevState,
        role: e.target.value,
      }));
    } else {
      // For other input fields (nombre, email, password), update them as before.
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value,
      }));
    }
  }

  function onHcaptchaChange(token) {
    setHcaptchaToken(token);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!hcaptchaToken) {
      toast.error("Por favor, complete la verificación de captcha.");
      return;
    }

    try {
      const auth = getAuth();
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(auth.currentUser, {
        displayName: nombre,
      });
      const user = userCredentials.user;
      const formDataCopy = {
        ...formData,
        fecha_creacion: serverTimestamp(),
      };
      delete formDataCopy.password;

      await setDoc(doc(db, "users", user.uid), formDataCopy);
      toast.success("Cuenta creada exitosamente!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section>
      <h1 className="mt-6 text-center text-3xl font-extrabold">Registrarse</h1>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-6 py-11">
        <div className="mb-12 md:mb-6 md:w-[67%] lg:w-[50%]">
          <img
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2022&q=80"
            alt="password"
            className="w-full rounded-lg shadow-2xl"
          />
        </div>
        <div className="w-full md:w-[67%] lg:ml-20 lg:w-[40%]">
          <form onSubmit={onSubmit}>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={onChange}
              placeholder="Nombre"
              required
              className="mb-6 w-full rounded border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />
            <input
              type="email"
              id="email"
              value={email}
              onChange={onChange}
              placeholder="Email"
              required
              className="mb-6 w-full rounded border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />

            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
                required
                className="w-full rounded border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
              />
              {showPassword ? (
                <AiFillEyeInvisible
                  className="absolute right-3 top-3 cursor-pointer text-xl"
                  onClick={() => setShowPassword((prevState) => !prevState)}
                />
              ) : (
                <AiFillEye
                  className="absolute right-3 top-3 cursor-pointer text-xl"
                  onClick={() => setShowPassword((prevState) => !prevState)}
                />
              )}
            </div>

            <div className="mb-4 flex justify-between">
              <label>
                <input
                  type="radio"
                  id="donor"
                  name="role"
                  value="donor"
                  checked={role === "donor"}
                  onChange={onChange}
                />
                Soy un donante
              </label>

              <label>
                <input
                  type="radio"
                  id="schoolRep"
                  name="role"
                  value="schoolRep"
                  checked={role === "schoolRep"}
                  onChange={onChange}
                />
                Soy un representante de escuela
              </label>
            </div>

            <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg">
              <p className="mb-6">
                ¿Ya se encuentra registrado?{" "}
                <Link
                  to="/sign-in"
                  className="text-red-600 underline transition duration-200 ease-in-out hover:text-red-800"
                >
                  Iniciar sesión
                </Link>
              </p>
              <p></p>
            </div>
            <HCaptcha
              sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
              onVerify={onHcaptchaChange}
              className="mb-6"
            />
            <br />
            <button
              className="w-full rounded bg-red-600 px-4 py-2 font-medium uppercase text-white shadow-lg transition duration-200 ease-in-out hover:bg-red-700 hover:shadow-xl active:bg-red-900"
              type="submit"
            >
              Registrarse
            </button>
            <div className="my-4 flex items-center before:flex-1 before:border-t before:border-gray-300 after:flex-1 after:border-t after:border-gray-300">
              <p className="mx-4 text-center font-semibold">O</p>
            </div>
            <OAuth role={role} />
          </form>
        </div>
      </div>
    </section>
  );
}
