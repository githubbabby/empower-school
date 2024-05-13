import React, { useEffect, useState } from "react";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import SchoolItem from "../components/SchoolItem";
import AsyncSelect from "react-select/async";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { getDoc } from "firebase/firestore";
import Spinner from "../components/Spinner";
import { set } from "lodash";

export default function Profile() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: auth.currentUser.displayName,
    apellido: "",
    email: auth.currentUser.email,
    telefono: "",
    direccion: "",
    distrito: "",
    departamento: "",
    barrio: "",
    latitud: -25.306166036627506,
    longitud: -57.53814697265626,
  });

  const {
    nombre,
    apellido,
    email,
    telefono,
    direccion,
    distrito,
    departamento,
    barrio,
    latitud,
    longitud,
  } = formData;

  useEffect(() => {
    async function fetchUserData() {
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion,
            distrito: data.distrito,
            departamento: data.departamento,
            barrio: data.barrio,
            latitud: data.latitud,
            longitud: data.longitud,
          });

          setMarkerPosition([data.latitud, data.longitud]);
        }
      } catch (error) {
        toast.error(error.message);
      }
      setLoading(false);
    }
    fetchUserData();
  }, [auth.currentUser.uid]);

  function onLogOut() {
    try {
      signOut(auth);
      toast.success("Sesion cerrada con exito");
      navigate("/sign-in");
    } catch (error) {
      toast.error(error.message);
    }
  }
  const loadOptions = async (inputValue) => {
    try {
      if (inputValue === "") {
        inputValue = "a";
      }
      const distritosRef = collection(db, "distritos");
      const querySnapshot = await getDocs(
        query(
          distritosRef,
          where("nombre_minus", ">=", inputValue.toLowerCase()),
          where("nombre_minus", "<=", inputValue.toLowerCase() + "\uf8ff")
        )
      );
      const distritos = querySnapshot.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().nombre,
        departamento: doc.data().departamento,
      }));
      return distritos;
    } catch (error) {
      toast.error(error.message);
      return [];
    }
  };

  const handleDistritoChange = async (selectedOption) => {
    // Fetch geolocation data from Google Geocode API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${
        selectedOption.label
      },${selectedOption.departamento},Paraguay&key=${
        import.meta.env.VITE_REACT_APP_GEOCODE_API_KEY
      }`
    );
    const data = await response.json();

    // Extract latitude and longitude from response data
    const { lat, lng } = data.results[0].geometry.location;

    // Update form data and marker position
    setFormData({
      ...formData,
      distrito: selectedOption.label,
      departamento: selectedOption.departamento,
      latitud: lat,
      longitud: lng,
    });
    setMarkerPosition([lat, lng]);
  };

  const [markerPosition, setMarkerPosition] = useState([latitud, longitud]);

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    console.log(lat, lng);
    setFormData({
      ...formData,
      latitud: lat,
      longitud: lng,
    });
    setMarkerPosition([lat, lng]);
  };

  function MyMap({ center }) {
    const map = useMap();

    React.useEffect(() => {
      map.flyTo(center);
    }, [center, map]);

    return null;
  }

  function onChange(e) {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  }

  async function onSubmit() {
    try {
      if (auth.currentUser.displayName !== nombre) {
        await updateProfile(auth.currentUser, {
          displayName: nombre,
        });
      }
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, {
        nombre,
        apellido,
        telefono,
        direccion,
        distrito,
        departamento,
        barrio,
        latitud,
        longitud,
      });
      toast.success("Perfil actualizado con exito");
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
          orderBy("fecha_creacion", "desc")
        );
        const querySnapshot = await getDocs(q);
        let schools = [];

        querySnapshot.forEach((doc) => {
          return schools.push({ id: doc.id, data: doc.data() });
        });
        setSchools(schools);
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
  if (loading) {
    return <Spinner />;
  }
  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-col items-center justify-center">
        <h1 className="mt-6 text-center text-3xl font-bold">
          Perfil de Usuario
        </h1>
        <div className="mt-6 w-full px-3 md:w-[50%]">
          <form>
            {/* Nombre */}
            <p className="mt-6 text-lg font-semibold">Nombre</p>
            <input
              type="text"
              id="nombre"
              value={nombre}
              disabled={!isEditing}
              onChange={onChange}
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />
            {/* Apellido */}
            <p className="mt-6 text-lg font-semibold">Apellido</p>
            <input
              type="text"
              id="apellido"
              value={apellido}
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
            <p className="mt-6 text-lg font-semibold">Email</p>
            <input
              type="email"
              id="email"
              value={email}
              readOnly
              className="mb-6 w-full rounded border border-transparent bg-gray-200 px-4 py-2 text-xl text-gray-700 transition ease-in-out"
            />
            {/* Phone */}
            <p className="mt-6 text-lg font-semibold">Telefono</p>
            <input
              type="tel"
              id="telefono"
              value={telefono}
              disabled={!isEditing}
              onChange={onChange}
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />
            {/* Direccion */}
            <p className="mt-6 text-lg font-semibold">Direccion</p>
            <input
              type="text"
              id="direccion"
              value={direccion}
              disabled={!isEditing}
              onChange={onChange}
              minLength={3}
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />
            {/* Distrito */}
            <p className="mt-6 text-lg font-semibold">Ciudad</p>
            <AsyncSelect
              type="select"
              id="distrito"
              value={{ label: distrito, value: distrito }}
              isDisabled={!isEditing}
              onChange={handleDistritoChange}
              defaultOptions
              loadOptions={loadOptions}
              required
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />
            {/* Departamento */}
            <p className="mt-6 text-lg font-semibold">Departamento</p>
            <input
              type="text"
              id="departamento"
              value={departamento}
              readOnly
              className="mt-6 w-full rounded-md border border-gray-300 bg-gray-200 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            {/* Barrio */}
            <p className="mt-6 text-lg font-semibold">Barrio</p>
            <input
              type="text"
              id="barrio"
              value={barrio}
              disabled={!isEditing}
              onChange={onChange}
              minLength={3}
              className={
                "mb-6 w-full rounded border px-4 py-2 text-xl text-gray-700 transition ease-in-out" +
                (isEditing
                  ? " cursor-text border-gray-300 bg-white"
                  : " border-transparent bg-gray-200")
              }
            />
            {/* Mapa */}
            <p className="mt-6 text-lg font-semibold">
              Marque su ubicacion general en el mapa (arrastre el marcador
              manteniendo apretado el boton izquierdo del mouse para definir su
              ubicacion en el mapa. Puede usar la rueda del mouse para hacer
              zoom en el mapa.)
            </p>
            <div className="mt-6 h-96 w-full rounded-md bg-gray-300">
              <MapContainer
                center={markerPosition}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                />
                <Marker
                  draggable={isEditing}
                  position={markerPosition}
                  eventHandlers={{
                    dragend: handleMarkerDragEnd,
                  }}
                />
                <MyMap center={markerPosition} />
              </MapContainer>
            </div>
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
