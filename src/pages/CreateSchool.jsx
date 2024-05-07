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
import { useMap } from "react-leaflet";
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
  const [institutes, setInstitutes] = useState([{}]);

  const handleAddInstitute = () => {
    setInstitutes([...institutes, {}]);
  };

  const handleRemoveInstitute = (index) => {
    const newInstitutes = [...institutes];
    newInstitutes.splice(index, 1);
    setInstitutes(newInstitutes);
  };

  const handleInstituteChange = (index, event) => {
    const newInstitutes = [...institutes];
    newInstitutes[index][event.target.name] = event.target.value;
    setInstitutes(newInstitutes);
  };

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

    try {
      const docRef = await addDoc(collection(db, "escuelas"), formDataCopy);
      if (institutes.length > 0) {
        for (const institute of institutes) {
          await addDoc(collection(db, "escuelas", docRef.id, "institutos"), {
            ...institute,
            id_usuario: auth.currentUser.uid,
            fecha_creacion: serverTimestamp(),
          });
        }
      }
      setLoading(false);
      toast.success("Establecimiento registrado con exito");
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
    <main className="mx-auto px-2 md:max-w-3xl lg:max-w-5xl">
      <h1 className="mt-6 text-center text-3xl font-bold">
        Registrar un Establecimiento
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <p className="mt-6 text-lg font-semibold">Nombre del Establecimiento</p>
        <input
          type="text"
          id="nombre"
          value={nombre}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {institutes.map((institute, index) => (
          <div key={index}>
            <div className="mt-6 rounded-lg bg-white px-9 py-6 shadow-lg">
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <p className="text-lg font-semibold">Nombre del Instituto</p>
                <button
                  className="rounded-md bg-red-700 px-3 py-2 text-white focus:bg-red-500 focus:outline-none"
                  type="button"
                  onClick={() => handleRemoveInstitute(index)}
                >
                  Remover Institucion
                </button>
              </div>
              <input
                type="text"
                name="nombre_instituto"
                value={institute.nombre_instituto || ""}
                onChange={(event) => handleInstituteChange(index, event)}
                minLength={3}
                required
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-6 text-lg font-semibold">Turno</p>
              <input
                type="text"
                name="turno"
                value={institute.turno || ""}
                onChange={(event) => handleInstituteChange(index, event)}
                minLength={3}
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}

        <button
          className="mt-9 rounded-md bg-green-700 px-3 py-2 text-white focus:bg-green-500 focus:outline-none"
          type="button"
          onClick={handleAddInstitute}
        >
          Añadir Institucion
        </button>

        {/* Direccion */}
        <p className="mt-6 text-lg font-semibold">
          Direccion del Establecimiento
        </p>
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
          Por favor marque el Establecimiento en el mapa (arrastre el marcador
          manteniendo apretado el boton izquierdo del mouse para ubicar la
          Establecimiento exactamente en el mapa. Puede usar la rueda del mouse
          para hacer zoom en el mapa.)
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
          <p className="text-lg font-semibold">Imagenes del Establecimiento</p>
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
          className="mb-6 mt-6 w-full rounded-md bg-blue-500 px-3 py-4 text-white focus:bg-blue-600 focus:outline-none"
        >
          Registrar
        </button>
      </form>
    </main>
  );
}
