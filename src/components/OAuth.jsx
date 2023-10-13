import React from "react";
import { FcGoogle } from "react-icons/fc";

export default function OAuth() {
  return (
    <button className="flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 font-medium uppercase text-white shadow-lg transition duration-200 ease-in-out hover:bg-blue-700 hover:shadow-xl active:bg-blue-900">
      <FcGoogle className="mr-2 rounded-full bg-white text-2xl" />
      Continue with Google
    </button>
  );
}
