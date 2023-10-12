import { useLocation, useNavigate } from "react-router-dom";
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  function pathMathRoute(route) {
    if (route === location.pathname) {
      return true;
    }
  }
  return (
    <div className="sticky top-0 z-50 border-b bg-red-300 shadow-sm">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-3">
        <div>
          <img
            src="https://static.rdc.moveaws.com/images/logos/rdc-logo-default.svg"
            alt="logo"
            className="h-5 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        <div>
          <ul className="flex space-x-10">
            <li
              className={`cursor-pointer border-b-[3px] border-b-transparent py-3 text-sm font-semibold text-gray-400 ${
                pathMathRoute("/") && "border-b-red-500 text-black"
              }`}
              onClick={() => navigate("/")}
            >
              Home
            </li>
            <li
              className={`cursor-pointer border-b-[3px] border-b-transparent py-3 text-sm font-semibold text-gray-400 ${
                pathMathRoute("/schools") && "border-b-red-500 text-black"
              }`}
              onClick={() => navigate("/schools")}
            >
              Schools
            </li>
            <li
              className={`cursor-pointer border-b-[3px] border-b-transparent py-3 text-sm font-semibold text-gray-400 ${
                pathMathRoute("/sign-in") && "border-b-red-500 text-black"
              }`}
              onClick={() => navigate("/sign-in")}
            >
              Sign In
            </li>
          </ul>
        </div>
      </header>
    </div>
  );
}
