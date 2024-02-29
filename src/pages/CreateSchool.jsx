import React, { useState } from "react";
import AsyncSelect from "react-select/async";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import {
  collection,
  getDocs,
  addDoc,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { storeImage } from "../imageUtils";
import { getAuth } from "firebase/auth";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";

export default function CreateSchool() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    distrito: "",
    departamento: "",
    barrio: "",
    latitud: -25.306166036627506,
    longitud: -57.53814697265626,
    imagenes: [],
  });
  const {
    nombre,
    direccion,
    distrito,
    departamento,
    barrio,
    latitud,
    longitud,
    imagenes,
  } = formData;

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
  const handleDistritoChange = (selectedOption) => {
    setFormData({
      ...formData,
      distrito: selectedOption.label,
      departamento: selectedOption.departamento,
    });
  };
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (e.target.files) {
      setFormData({ ...formData, imagenes: e.target.files });
    }
  };

  const [markerPosition, setMarkerPosition] = useState([latitud, longitud]);

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPosition([lat, lng]);
    setFormData({ ...formData, latitud: lat, longitud: lng });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (imagenes.length > 6) {
      setLoading(false);
      toast.error("Solo se pueden subir 6 imagenes");
      return;
    }

    const imgUrls = await Promise.all(
      Array.from(imagenes).map((imagen) => storeImage("escuelas", imagen))
    ).catch((error) => {
      setLoading(false);
      console.error(error);
      return;
    });

    const formDataCopy = {
      ...formData,
      imgUrls,
      id_usuario: auth.currentUser.uid,
      fecha_creacion: serverTimestamp(),
    };
    delete formDataCopy.imagenes;

    try {
      const docRef = await addDoc(collection(db, "escuelas"), formDataCopy);
      setLoading(false);
      toast.success("Escuela registrada con exito");
      navigate("/");
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(error.message);
    }
  }

  if (loading) {
    return <Spinner />;
  }
  return (
    <main className="mx-auto max-w-md px-2">
      <h1 className="mt-6 text-center text-3xl font-bold">
        Registrar una escuela
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <p className="mt-6 text-lg font-semibold">Nombre de la escuela</p>
        <input
          type="text"
          id="nombre"
          value={nombre}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Direccion */}
        <p className="mt-6 text-lg font-semibold">Direccion de la escuela</p>
        <input
          type="text"
          id="direccion"
          value={direccion}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Distrito */}
        <p className="mt-6 text-lg font-semibold">Ciudad</p>
        <AsyncSelect
          type="select"
          id="distrito"
          value={distrito.label}
          onChange={handleDistritoChange}
          defaultOptions
          loadOptions={loadOptions}
          required
          className="mt-6"
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
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Mapa */}
        <p className="mt-6 text-lg font-semibold">
          Por favor marque la escuela en el mapa (arrastre el marcador
          manteniendo apretado el boton izquierdo del mouse para ubicar la
          escuela exactamente en el mapa. Puede usar la rueda del mouse para
          hacer zoom en el mapa.)
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
              draggable={true}
              position={markerPosition}
              eventHandlers={{
                dragend: handleMarkerDragEnd,
              }}
            />
          </MapContainer>
        </div>
        {/* Imagenes */}
        <div className="mb-6">
          <p className="text-lg font-semibold">Imagenes de la escuela</p>
          <input
            type="file"
            id="imagenes"
            onChange={onChange}
            multiple
            accept=".jpg, .jpeg, .png"
            required
            className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-blue-500 px-3 py-4 text-white focus:bg-blue-600 focus:outline-none"
        >
          Registrar
        </button>
      </form>
    </main>
  );
}
