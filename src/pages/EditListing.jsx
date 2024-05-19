import React, { useEffect, useState } from "react";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { storeImage } from "../imageUtils";
import { getAuth } from "firebase/auth";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import Spinner from "../components/Spinner";
import { useParams, useNavigate } from "react-router-dom";
import _ from "lodash";
import Select from "react-select";
import { breakfastlunchItems } from "../datasets/breakfastlunchItems";

export default function EditListing() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    observacion: "",
  });
  const { nombre, observacion } = formData;

  const [listingItems, setListingItems] = useState([{}]);
  const [originalListingItems, setOriginalListingItems] = useState([]);
  const [deletedListingItems, setDeletedListingItems] = useState([]);

  const params = useParams();

  useEffect(() => {
    setLoading(true);
    async function fetchListing() {
      const docRef = doc(db, "pedidos", params.listingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (auth.currentUser.uid !== data.id_usuario) {
          toast.error("No tienes permiso para editar este pedido");
          navigate("/");
        }
        setFormData({
          nombre: data.nombre,
          observacion: data.observacion,
        });

        const listingItemsRef = collection(
          db,
          "pedidos",
          params.listingId,
          "articulos"
        );
        const listingItemsSnapshot = await getDocs(listingItemsRef);
        if (listingItemsSnapshot.docs.length > 0) {
          const listingItemsList = listingItemsSnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));
          setListingItems(listingItemsList);
          setOriginalListingItems(listingItemsList);
        }
      } else {
        toast.error("Pedido no encontrado");
      }
      setLoading(false);
    }
    fetchListing();
  }, [navigate, params.listingId, auth.currentUser.uid]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (e.target.files) {
      setFormData({ ...formData, images: e.target.files });
    }
  };

  const handleAddListingItem = () => {
    setListingItems([
      ...listingItems,
      { nombre_articulo: "", cantidad: 1, categoria: "", observacion: "" },
    ]);
  };

  const handleRemoveListingItem = (listingItemId, index) => {
    if (listingItemId) {
      setDeletedListingItems([...deletedListingItems, listingItemId]);
    }
    const newListingItems = [...listingItems];
    newListingItems.splice(index, 1);
    setListingItems(newListingItems);
  };

  const handleListingItemChange = (index, event) => {
    const { name, value } = event.target;
    const newListingItems = [...listingItems];
    newListingItems[index] = { ...newListingItems[index], [name]: value };
    setListingItems(newListingItems);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = doc(db, "pedidos", params.listingId);
      await updateDoc(docRef, {
        ...formData,
        fecha_modificacion: serverTimestamp(),
      });

      const listingItemsRef = collection(
        db,
        "pedidos",
        params.listingId,
        "articulos"
      );

      const batch = [];

      listingItems.forEach((listingItem) => {
        try {
          if (listingItem.uid) {
            const listingItemRef = doc(
              db,
              "pedidos",
              params.listingId,
              "articulos",
              listingItem.uid
            );
            const index = originalListingItems.findIndex(
              (originalListingItem) =>
                originalListingItem.uid === listingItem.uid
            );

            if (!_.isEqual(originalListingItems[index], listingItem)) {
              const { uid, ...listingItemCopy } = listingItem;
              batch.push(
                updateDoc(listingItemRef, {
                  ...listingItemCopy,
                  fecha_modificacion: serverTimestamp(),
                })
              );
            }
          } else {
            batch.push(
              console.log(listingItem),
              addDoc(listingItemsRef, {
                ...listingItem,
                id_usuario: auth.currentUser.uid,
                fecha_creacion: serverTimestamp(),
                estado: "pendiente",
              })
            );
          }
        } catch (error) {
          console.error(
            `Error processing listing item: ${listingItem.uid || "new"}`,
            error
          );
        }
      });
      if (deletedListingItems.length > 0) {
        deletedListingItems.forEach((listingItemId) => {
          try {
            const listingItemRef = doc(
              db,
              "pedidos",
              params.listingId,
              "articulos",
              listingItemId
            );
            batch.push(deleteDoc(listingItemRef));
          } catch (error) {
            console.error(
              `Error deleting listing item: ${listingItemId}`,
              error
            );
          }
        });
      }

      try {
        await Promise.all(batch);
      } catch (error) {
        console.error("Error executing batch", error);
      }

      setLoading(false);
      toast.success("Pedido actualizado correctamente");
      navigate(`/edit-listing/${docRef.id}`);
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
    }
  }

  if (loading) {
    return <Spinner />;
  }
  return (
    <main className="mx-auto px-2 md:max-w-3xl lg:max-w-6xl">
      <h1 className="mt-6 text-center text-3xl font-bold">Editar Pedido</h1>
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
                  onClick={() =>
                    handleRemoveListingItem(listingItem.uid, index)
                  }
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
              <p className="mt-6 text-lg font-semibold">Cantidad</p>
              <input
                type="number"
                name="cantidad"
                value={listingItem.cantidad || ""}
                onChange={(event) => handleListingItemChange(index, event)}
                required
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
                onChange={(selectedOption) =>
                  handleListingItemChange(index, {
                    target: {
                      name: "categoria",
                      value: selectedOption.value,
                    },
                  })
                }
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
        {/* Submit */}
        <button
          type="submit"
          className="mb-6 mt-6 w-full rounded-md bg-blue-500 px-3 py-4 text-white focus:bg-blue-600 focus:outline-none"
        >
          Editar
        </button>
      </form>
    </main>
  );
}
