import React, { useEffect, useState } from "react";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { storeImage } from "../imageUtils";
import { getAuth } from "firebase/auth";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import Spinner from "../components/Spinner";
import { useParams, useNavigate } from "react-router-dom";

export default function EditSchool() {
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

  const params = useParams();

  useEffect(() => {
    setLoading(true);
    async function fetchSchool() {
      const docRef = doc(db, "escuelas", params.schoolId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (auth.currentUser.uid !== data.id_usuario) {
          toast.error("No tiene permisos para editar esta escuela");
          navigate("/");
        }
        setFormData({
          nombre: data.nombre,
          direccion: data.direccion,
          distrito: data.distrito,
          departamento: data.departamento,
          barrio: data.barrio,
          latitud: data.latitud,
          longitud: data.longitud,
        });
        setMarkerPosition([data.latitud, data.longitud]);
      } else {
        toast.error("No se encontro la escuela");
      }
      setLoading(false);
    }
    fetchSchool();
  }, [navigate, params.schoolId, auth.currentUser.uid]);

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

  function MyMap({ center }) {
    const map = useMap();

    React.useEffect(() => {
      map.flyTo(center);
    }, [center, map]);

    return null;
  }

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

    console.log(formDataCopy);

    try {
      const docRef = doc(db, "escuelas", params.schoolId);
      await updateDoc(docRef, formDataCopy);
      setLoading(false);
      toast.success("Escuela actualizada correctamente!");
      navigate(`/edit-school/${docRef.id}`);
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
      <h1 className="mt-6 text-center text-3xl font-bold">Editar escuela</h1>
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
        <input
          type="text"
          id="distrito"
          value={distrito}
          readOnly
          className="mt-6 w-full rounded-md border border-gray-300 bg-gray-200 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500"
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
            <MyMap center={markerPosition} />
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
          Guardar
        </button>
      </form>
    </main>
  );
}
