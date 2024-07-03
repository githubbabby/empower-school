import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { MdLocationPin } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function ListingCard({ listing, listingItems, id }) {
  if (listing.eliminado) return null;
  const navigate = useNavigate();

  return (
    <li className="relative m-[10px] flex flex-col items-center justify-between overflow-hidden rounded-md bg-white shadow-md transition-shadow duration-150 hover:shadow-xl">
      <Link className="contents" to={`/listing/${id}`}>
        <div className="absolute right-2 top-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
          {dayjs(listing.fecha_creacion?.toDate()).fromNow()}
        </div>

        <div className="w-full p-[10px]">
          <p className="m-0 truncate text-xl font-semibold text-[#9d4545]">
            {listing.nombre}
          </p>
          <br />
          <p className="m-0 text-sm font-semibold text-gray-600">
            {listing.observacion}
          </p>
        </div>
      </Link>
      <ul>
        {listingItems.map((listingItem) => (
          <li
            key={listingItem.id}
            className="relative m-[10px] overflow-hidden rounded-md border-2 border-[#f4c3c3] bg-white shadow-md transition-shadow duration-150 hover:shadow-xl"
          >
            <p>{listingItem.data.nombre_articulo}</p>
            <p>Cantidad: {listingItem.data.cantidad}</p>
            <button
              onClick={() => navigate(`/contact/${listingItem.id}`)}
              className="transform rounded-full bg-pink-700 px-4 py-2 font-bold text-white transition duration-300 ease-in-out hover:-translate-y-1 hover:bg-pink-400"
            >
              Contactar
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}
