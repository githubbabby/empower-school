import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

export default function ListingCard({ listing, listingItem, id }) {
  if (listing.eliminado) return null;
  const navigate = useNavigate();

  dayjs.extend(relativeTime);
  const fechaCreacion = dayjs(listingItem.fecha_creacion?.toDate());
  const now = dayjs();
  const monthsDiff = now.diff(fechaCreacion, "months");
  const daysDiff = now
    .subtract(monthsDiff, "months")
    .diff(fechaCreacion, "days");

  const relativeDate = `Hace ${daysDiff} dia${
    daysDiff === 1 ? "" : "s"
  } y ${monthsDiff} mes${monthsDiff === 1 ? "" : "es"}`;

  return (
    <li className="relative m-[10px] flex flex-col items-center justify-between overflow-hidden rounded-md bg-white shadow-md transition-shadow duration-150 hover:shadow-xl">
      <Link className="contents" to={`/listing/${id}`}>
        <div className="w-full p-[10px]">
          <div className="flex items-start justify-between">
            <p className="flex-grow text-xl font-semibold text-[#9d4545]">
              {listingItem.nombre_articulo}
            </p>
            <div className="ml-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
              {relativeDate}
            </div>
          </div>
          <p className="m-0 text-sm font-semibold text-gray-600">
            {listingItem.ingrediente} - {listingItem.categoria}
          </p>
          <br />
          <p className="mb-6 text-sm font-semibold text-gray-600">
            {listingItem.observacion}
          </p>

          <br />

          <div className="items-left justify-left absolute bottom-2 left-2 flex space-x-2">
            <p className="m-0 text-xl font-bold">
              {listingItem.cantidad} unidades
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}
