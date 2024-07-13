import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { MdLocationPin } from "react-icons/md";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function Listing() {
  const params = useParams();
  const [listing, setListing] = useState(null);
  const [listingItem, setListingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, "pedidos", params.listingId);
      return getDoc(docRef);
    };

    const fetchListingItem = async () => {
      const docRef = doc(
        db,
        "pedidos",
        params.listingId,
        "articulos",
        params.listingItemId
      );
      return getDoc(docRef);
    };

    Promise.all([fetchListing(), fetchListingItem()])
      .then(([listingSnap, listingItemSnap]) => {
        if (listingSnap.exists()) {
          setListing(listingSnap.data());
        } else {
          console.log("No such document!");
          toast.error("No se encontró el pedido");
        }

        if (listingItemSnap.exists()) {
          setListingItem(listingItemSnap.data());
        } else {
          console.log("No such document!");
          toast.error("Error al obtener el pedido");
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting documents:", error);
        toast.error("Error al obtener los pedidos");
        setLoading(false);
      });
  }, [params.listingId, params.listingItemId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <main>
      <div className="m-4 flex max-w-6xl flex-col rounded-xl bg-white p-4 shadow-lg md:flex-row lg:mx-auto lg:space-x-5">
        <div className="lg-[400px] h-[200px] w-full">
          <p className="text-2xl font-bold text-[#9d4545]">{listing.nombre}</p>
          <p className="text-md font-semibold text-gray-600">
            Creado el:{" "}
            {listing.fecha_creacion.toDate().toLocaleDateString("es-PY")}
          </p>

          <p className="text-mb mt-6 font-semibold text-gray-700">
            {listing.observacion}
          </p>
          <div>
            <p className="mb-3 mt-9 text-sm font-semibold text-gray-700">
              Escuela publica nro 324
            </p>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Direccion: Isla Po'i casi Machareti
            </p>
            <p className="text-sm font-semibold text-gray-700">
              Mariano Roque Alonso, Central
            </p>
          </div>
        </div>

        <div className="lg-[400px] z-10 h-[400px] w-full overflow-x-hidden">
          <MapContainer
            center={[listing.latitud, listing.longitud]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />
            <Marker
              draggable={false}
              position={[listing.latitud, listing.longitud]}
              eventHandlers={{
                click: () => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitud},${listing.longitud}`;
                  window.open(mapsUrl, "_blank");
                },
              }}
            />
          </MapContainer>
        </div>
      </div>
      <div className="m-4 mx-auto flex max-w-xl flex-col rounded-xl bg-white p-4 shadow-lg">
        <p className="text-lg font-semibold text-[#9d4545]">
          {listingItem.nombre_articulo}
        </p>
        <p className="text-md font-semibold text-gray-600">
          {listingItem.ingrediente} - {listingItem.categoria}
        </p>
        <p className="mt-6 text-sm font-semibold text-gray-700">
          {listingItem.observacion}
        </p>
        <div className="mt-6 flex items-center space-x-2">
          <p className="text-2xl font-bold">{listingItem.cantidad} unidades</p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <button className="m-4 rounded-lg bg-pink-700 p-2 font-semibold text-white hover:bg-pink-900">
          Marcar como entregado 📦
        </button>
      </div>
    </main>
  );
}
