import React, { useState } from "react";
import AsyncSelect from "react-select/async";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function CreateSchool() {
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    distrito: "",
    departamento: "",
    barrio: "",
    latitude: -25.306166036627506,
    longitude: -57.53814697265626,
  });
  const {
    nombre,
    direccion,
    distrito,
    departamento,
    barrio,
    latitude,
    longitude,
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
  };

  const [markerPosition, setMarkerPosition] = useState([latitude, longitude]);

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPosition([lat, lng]);
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };
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
