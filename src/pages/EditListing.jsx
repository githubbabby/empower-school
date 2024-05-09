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

export default function EditListing() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    images: [],
  });
  const { title, description, price, location, images } = formData;

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
        if (auth.currentUser.uid !== data.userId) {
          toast.error("No tienes permiso para editar este pedido");
          navigate("/");
        }
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          location: data.location,
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
    setListingItems([...listingItems, { name: "", quantity: "" }]);
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
    const newListingItems = [...listingItems];
    newListingItems[index] = {
      ...newListingItems[index],
      [event.target.name]: event.target.value,
    };
    setListingItems(newListingItems);
  };

  const [markerPosition, setMarkerPosition] = useState([0, 0]);

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPosition([lat, lng]);
    setFormData({ ...formData, location: `${lat}, ${lng}` });
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

    if (images.length > 6) {
      setLoading(false);
      toast.error("Solo puedes subir hasta 6 imágenes");
      return;
    }

    const imgUrls = await Promise.all(
      Array.from(images).map((image) => storeImage("pedidos", image))
    ).catch((error) => {
      setLoading(false);
      console.error(error);
      return;
    });

    const formDataCopy = {
      ...formData,
      imgUrls,
      lastModified: serverTimestamp(),
    };
    delete formDataCopy.images;

    try {
      const docRef = doc(db, "pedidos", params.listingId);
      await updateDoc(docRef, formDataCopy);

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
                  lastModified: serverTimestamp(),
                })
              );
            }
          } else {
            batch.push(
              addDoc(listingItemsRef, {
                ...listingItem,
                created: serverTimestamp(),
                userId: auth.currentUser.uid,
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
    <main className="mx-auto px-2 md:max-w-3xl lg:max-w-5xl">
      <h1 className="mt-6 text-center text-3xl font-bold">Edit Pedido</h1>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <p className="mt-6 text-lg font-semibold">Pedido Title</p>
        <input
          type="text"
          id="title"
          value={title}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {listingItems &&
          listingItems.length > 0 &&
          listingItems.map((listingItem, index) => (
            <div key={index}>
              <div className="mt-6 rounded-lg bg-white px-9 py-6 shadow-lg">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                  <p className="text-lg font-semibold">Articulo Name</p>
                  <button
                    className="rounded-md bg-red-700 px-3 py-2 text-white focus:bg-red-500 focus:outline-none"
                    type="button"
                    onClick={() =>
                      handleRemoveListingItem(listingItem.uid, index)
                    }
                  >
                    Remove Articulo
                  </button>
                </div>
                <input
                  type="text"
                  name="name"
                  value={listingItem.name}
                  onChange={(event) => handleListingItemChange(index, event)}
                  minLength={3}
                  required
                  className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-6 text-lg font-semibold">Quantity</p>
                <input
                  type="text"
                  name="quantity"
                  value={listingItem.quantity}
                  onChange={(event) => handleListingItemChange(index, event)}
                  minLength={3}
                  className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}

        <button
          className="mt-9 rounded-md bg-green-700 px-3 py-2 text-white focus:bg-green-500 focus:outline-none"
          type="button"
          onClick={handleAddListingItem}
        >
          Add Articulo
        </button>
        {/* Description */}
        <p className="mt-6 text-lg font-semibold">Pedido Description</p>
        <input
          type="text"
          id="description"
          value={description}
          required
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Price */}
        <p className="mt-6 text-lg font-semibold">Price</p>
        <input
          type="text"
          id="price"
          value={price}
          required
          onChange={onChange}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Location */}
        <p className="mt-6 text-lg font-semibold">Location</p>
        <input
          type="text"
          id="location"
          value={location}
          onChange={onChange}
          minLength={3}
          className="mt-6 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Map */}
        <p className="mt-6 text-lg font-semibold">
          Please mark the location on the map (drag the marker while holding
          down the left mouse button to precisely locate the listing on the map.
          You can use the mouse wheel to zoom in and out of the map.)
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
        {/* Images */}
        <div className="mb-6">
          <p className="text-lg font-semibold">Pedido Images</p>
          <input
            type="file"
            id="images"
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
          Save
        </button>
      </form>
    </main>
  );
}
