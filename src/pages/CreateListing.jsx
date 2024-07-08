import React, { useState } from "react";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Spinner from "../components/Spinner";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { breakfastlunchItems } from "../datasets/breakfastlunchItems";

export default function CreateListing() {
  const params = useParams();
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

  function handleListingItemChange(index, ...changes) {
    setListingItems((prevItems) => {
      const newItems = [...prevItems];
      changes.forEach((change) => {
        newItems[index] = {
          ...newItems[index],
          [change.target.name]: change.target.value,
        };
      });
      return newItems;
    });
  }

  const { nombre, observacion } = listingData;

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
      id_instituto: params.instituteId,
      fecha_creacion: serverTimestamp(),
      estado: "pendiente",
    };

    try {
      const docRef = await addDoc(collection(db, "pedidos"), listingDataCopy);
      if (listingItems.length > 0) {
        for (const listingItem of listingItems) {
          await addDoc(collection(db, "pedidos", docRef.id, "articulos"), {
            ...listingItem,
            id_usuario: auth.currentUser.uid,
            id_pedido: docRef.id,
            id_instituto: params.instituteId,
            fecha_creacion: serverTimestamp(),
            estado: "pendiente",
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
    <main className="mx-auto px-2 md:max-w-3xl lg:max-w-6xl">
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
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="mt-6 text-lg font-semibold">Categoria</p>
              <Select
                options={breakfastlunchItems.map((item) => ({
                  value: item.category,
                  label: item.category,
                }))}
                value={{
                  value: listingItem.categoria,
                  label: listingItem.categoria,
                }}
                onChange={(selectedOption) => {
                  handleListingItemChange(
                    index,
                    {
                      target: {
                        name: "categoria",
                        value: selectedOption ? selectedOption.value : "",
                      },
                    },
                    {
                      target: {
                        name: "ingrediente",
                        value: "",
                      },
                    }
                  );
                }}
                className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-6 text-lg font-semibold">Item</p>
              {listingItem.categoria && (
                <Select
                  options={breakfastlunchItems
                    .find((item) => item.category === listingItem.categoria)
                    ?.ingredients.map((ingredient) => ({
                      value: ingredient,
                      label: ingredient,
                    }))}
                  value={{
                    value: listingItem.ingrediente,
                    label: listingItem.ingrediente,
                  }}
                  onChange={(selectedOption) =>
                    handleListingItemChange(index, {
                      target: {
                        name: "ingrediente",
                        value: selectedOption ? selectedOption.value : "",
                      },
                    })
                  }
                  className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
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
