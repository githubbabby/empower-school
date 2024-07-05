import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function ListingCard({ listing, listingItem, id }) {
  if (listing.eliminado) return null;
  const navigate = useNavigate();

  return (
    <li className="relative m-[10px] flex flex-col items-center justify-between overflow-hidden rounded-md bg-white shadow-md transition-shadow duration-150 hover:shadow-xl">
      <Link className="contents" to={`/listing/${id}`}>
        <div className="absolute bottom-2 right-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
          {dayjs(listingItem.fecha_creacion?.toDate()).fromNow()}
        </div>

        <div className="w-full p-[10px]">
          <p className="m-0 truncate text-xl font-semibold text-[#9d4545]">
            {listingItem.nombre_articulo}
          </p>
          <br />
          <div className="flex items-center space-x-2">
            <p className="m-0 text-sm font-semibold text-gray-600">
              {listingItem.observacion}
            </p>
            <button className="absolute right-2 mt-2 rounded-full bg-pink-700 px-2 py-1 font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300">
              Ver detalles
            </button>
          </div>

          <br />
          <p className="m-0 text-xl font-bold">
            {listingItem.cantidad} unidades
          </p>
        </div>
      </Link>
    </li>
  );
}
