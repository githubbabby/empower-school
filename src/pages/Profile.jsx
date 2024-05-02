import React, { useEffect, useState } from "react";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import SchoolItem from "../components/SchoolItem";

export default function Profile() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    async function fetchUserSchools() {
      try {
        const SchoolRef = collection(db, "escuelas");
        const q = query(
          SchoolRef,
          where("id_usuario", "==", auth.currentUser.uid),
          orderBy("nombre", "asc")
        );
        const querySnapshot = await getDocs(q);
        let schools = [];

        querySnapshot.forEach((doc) => {
          return schools.push({ id: doc.id, data: doc.data() });
        });
        setSchools(schools);
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
      }
    }
    fetchUserSchools();
  }, [auth.currentUser.uid]);

  function onEdit(schoolId) {
    navigate(`/edit-school/${schoolId}`);
  }
  async function onDelete(schoolId) {
    if (window.confirm("Esta seguro de eliminar esta escuela?")) {
      try {
        const docRef = doc(db, "escuelas", schoolId);
        await updateDoc(docRef, {
          eliminado: true,
          fecha_eliminacion: serverTimestamp(),
        });
        setSchools((prevState) =>
          prevState.filter((school) => school.id !== schoolId)
        );
        toast.success("Escuela eliminada con exito");
      } catch (error) {
        toast.error(error.message);
      }
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
              className="mb-6 w-full rounded border border-transparent bg-gray-200 px-4 py-2 text-xl text-gray-700 transition ease-in-out"
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
          <button
            type="submit"
            className="w-full rounded bg-red-700 px-4 py-2 text-xl text-white transition duration-300 ease-in-out hover:bg-red-900"
          >
            <Link
              to="/create-school"
              className="flex items-center justify-center"
            >
              Registrar escuela
            </Link>
          </button>
        </div>
      </section>
      <div className="mx-auto mt-6 max-w-6xl px-3">
        {!loading && schools.length > 0 && (
          <>
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Mis Escuelas
            </h2>
            <ul className="mb-6 mt-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {schools.map((school) => (
                <SchoolItem
                  key={school.id}
                  id={school.id}
                  school={school.data}
                  onEdit={() => onEdit(school.id)}
                  onDelete={() => onDelete(school.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
