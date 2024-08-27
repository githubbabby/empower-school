import { useState } from "react";
import { Link } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const { email, password } = formData;
  const navigate = useNavigate();

  function onChange(e) {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  }

  function onHcaptchaChange(token) {
    setHcaptchaToken(token);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!hcaptchaToken) {
      toast.error("Por favor, complete el hCaptcha");
      return;
    }
    try {
      const auth = getAuth();
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredentials.user) {
        navigate("/");
        toast.success("Inicio de sesión exitoso");
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section>
      <h1 className="mt-6 text-center text-3xl font-extrabold">
        Iniciar sesión
      </h1>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-6 py-11">
        <div className="mb-12 md:mb-6 md:w-[67%] lg:w-[50%]">
          <img
            src="https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFzc3dvcmR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=900&q=60"
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
              placeholder="Email"
              className="mb-6 w-full rounded border-gray-300 bg-white px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
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
            <div className="mb-6 flex flex-col justify-between gap-4 whitespace-nowrap text-sm sm:flex-row sm:text-lg">
              <p>
                <Link
                  to="/forgot-password"
                  className="transition duration-200 ease-in-out hover:text-blue-800 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              <p>
                ¿No posee una cuenta?{" "}
                <Link
                  to="/sign-up"
                  className="text-red-600 underline transition duration-200 ease-in-out hover:text-red-800"
                >
                  Registrarse
                </Link>
              </p>
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
              Iniciar sesión
            </button>
            <div className="my-4 flex items-center before:flex-1 before:border-t before:border-gray-300 after:flex-1 after:border-t after:border-gray-300">
              <p className="mx-4 text-center font-semibold">O</p>
            </div>
            <OAuth />
          </form>
        </div>
      </div>
    </section>
  );
}
