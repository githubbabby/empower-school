import React, { useState } from "react";
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
import { getAuth } from "firebase/auth";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

export default function CreateListing() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);

  const [listingData, setListingData] = useState({
    nombre: "",
    observacion: "",
  });
  const [listingItems, setListingItems] = useState([{}]);

  const handleAddListingItem = () => {
    setListingItems([...listingItems, {}]);
  };

  const handleRemoveListingItem = (index) => {
    const newListingItems = [...listingItems];
    newListingItems.splice(index, 1);
    setListingItems(newListingItems);
  };

  const handleListingItemChange = (index, event) => {
    const newListingItems = [...listingItems];
    newListingItems[index][event.target.name] = event.target.value;
    setListingItems(newListingItems);
  };

  const { nombre, observacion } = listingData;

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
    setListingData({
      ...listingData,
      distrito: selectedOption.label,
      departamento: selectedOption.departamento,
      latitud: lat,
      longitud: lng,
    });
    setMarkerPosition([lat, lng]);
  };

  const onChange = (e) => {
    setListingData({ ...listingData, [e.target.id]: e.target.value });
    if (e.target.files) {
      setListingData({ ...listingData, imagenes: e.target.files });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const listingDataCopy = {
      ...listingData,
      id_usuario: auth.currentUser.uid,
      fecha_creacion: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "pedidos"), listingDataCopy);
      if (listingItems.length > 0) {
        for (const listingItem of listingItems) {
          await addDoc(collection(db, "pedidos", docRef.id, "articulos"), {
            ...listingItem,
            id_usuario: auth.currentUser.uid,
            fecha_creacion: serverTimestamp(),
          });
        }
      }
      setLoading(false);
      toast.success("Pedido registrado con exito");
      navigate(`/edit-listing/${docRef.id}`);
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
        Registrar un Pedido
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <p className="mt-6 text-lg font-semibold">Nombre del Pedido</p>
        <input
          type="text"
          id="nombre"
          value={nombre}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Observacion */}
        <p className="mt-6 text-lg font-semibold">Observacion</p>
        <textarea
          id="observacion"
          value={observacion}
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Articulos */}
        <p className="mt-6 text-center text-2xl font-semibold">Articulos</p>
        <div className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {listingItems.map((listingItem, index) => (
            <div
              key={index}
              className="mt-6 rounded-lg bg-white px-9 py-6 shadow-lg"
            >
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <p className="text-lg font-semibold">Nombre</p>
                <button
                  className="rounded-md bg-red-700 px-3 py-2 text-white focus:bg-red-500 focus:outline-none"
                  type="button"
                  onClick={() => handleRemoveListingItem(index)}
                >
                  Remover Articulo
                </button>
              </div>
              <input
                type="text"
                name="nombre_articulo"
                value={listingItem.nombre_articulo || ""}
                onChange={(event) => handleListingItemChange(index, event)}
                minLength={3}
                required
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mx-auto flex max-w-6xl items-center space-x-4">
                <div className="flex-1">
                  <p className="mt-6 text-lg font-semibold">Cantidad</p>
                  <input
                    type="number"
                    name="cantidad"
                    value={listingItem.cantidad || ""}
                    onChange={(event) => handleListingItemChange(index, event)}
                    min={1}
                    required
                    className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1">
                  <p className="mt-6 text-lg font-semibold">Categoria</p>
                  <Select
                    name="categoria"
                    value={listingItem.categoria || ""}
                    onChange={(selectedOption) =>
                      handleListingItemChange(index, {
                        target: {
                          name: "categoria",
                          value: selectedOption,
                        },
                      })
                    }
                    options={[
                      { value: "alimentos", label: "Alimentos" },
                      { value: "ropa", label: "Ropa" },
                      { value: "medicamentos", label: "Medicamentos" },
                      { value: "otros", label: "Otros" },
                    ]}
                    className="mt-6 w-full"
                  />
                </div>
              </div>
              <p className="mt-6 text-lg font-semibold">Observacion</p>
              <textarea
                name="observacion"
                value={listingItem.observacion || ""}
                onChange={(event) => handleListingItemChange(index, event)}
                minLength={3}
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          className="mt-9 rounded-md bg-green-700 px-3 py-2 text-white focus:bg-green-500 focus:outline-none"
          type="button"
          onClick={handleAddListingItem}
        >
          Añadir Articulo
        </button>

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
