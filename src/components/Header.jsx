import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function Header() {
  const [pageState, setPageState] = useState("...");
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setPageState("Perfil");
      } else {
        setPageState("Ingresar");
      }
    });
  });
  function pathMatchRoute(route) {
    if (route === location.pathname) {
      return true;
    }
  }
  return (
    <div className="sticky top-0 z-40 border-b bg-red-100 shadow-sm">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-3">
        <div
          className="flex cursor-pointer items-center"
          onClick={() => navigate("/")}
        >
          <img
            src="https://www.svgrepo.com/show/125442/school.svg"
            alt="logo"
            className="h-5"
          />
          <span className="ml-2 font-semibold">Potenciar Escuelas</span>
        </div>
        <div>
          <ul className="flex space-x-10">
            <li
              className={`cursor-pointer border-b-[3px] py-3 text-sm font-semibold  ${
                pathMatchRoute("/")
                  ? "border-b-red-500 text-black"
                  : "border-b-transparent text-gray-500"
              }`}
              onClick={() => navigate("/")}
            >
              Inicio
            </li>
            <li
              className={`cursor-pointer border-b-[3px] py-3 text-sm font-semibold ${
                pathMatchRoute("/schools")
                  ? "border-b-red-500 text-black"
                  : "border-b-transparent text-gray-500"
              }`}
              onClick={() => navigate("/schools")}
            >
              Escuelas
            </li>
            <li
              className={`cursor-pointer border-b-[3px] py-3 text-sm font-semibold ${
                (pathMatchRoute("/sign-in") || pathMatchRoute("/profile")) &&
                "border-b-red-500 text-black"
              }`}
              onClick={() => navigate("/profile")}
            >
              {pageState}
            </li>
          </ul>
        </div>
      </header>
    </div>
  );
}
