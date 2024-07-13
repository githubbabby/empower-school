import React, { useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function ListingCard({ id, listingItem, listingId, listing }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => setIsFlipped(!isFlipped);

  const calculateRelativeDate = (creationDate) => {
    if (!creationDate) return null;
    const now = dayjs();
    const monthsDiff = now.diff(creationDate, "months");
    const daysDiff = now.diff(creationDate.add(monthsDiff, "months"), "days");

    return `Hace ${daysDiff} día${
      daysDiff === 1 ? "" : "s"
    } y ${monthsDiff} mes${monthsDiff === 1 ? "" : "es"}`;
  };

  const creationDate = dayjs(
    listingItem.fecha_creacion?.toDate
      ? listingItem.fecha_creacion.toDate()
      : listingItem.fecha_creacion
  );
  const relativeDate = calculateRelativeDate(creationDate);

  return (
    <div className="mb-9 flex items-center justify-center">
      <div
        className="group h-72 w-11/12 transform transition duration-300 [perspective:500px] hover:scale-105 hover:shadow-lg"
        onClick={toggleFlip}
      >
        <div
          className={`relative h-full w-full rounded-xl shadow-2xl transition-all duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front of the card */}
          <div className="absolute inset-0 rounded-xl bg-white [backface-visibility:hidden]">
            <Link className="contents">
              <div className="w-full p-2.5">
                <div className="flex items-start justify-between">
                  <p className="flex-grow text-xl font-semibold text-[#9d4545]">
                    {listingItem.nombre_articulo}
                  </p>
                  {relativeDate && (
                    <div className="ml-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
                      {relativeDate}
                    </div>
                  )}
                </div>
                <p className="m-0 text-sm font-semibold text-gray-600">
                  {listingItem.ingrediente} - {listingItem.categoria}
                </p>
                <br />
                <p className="mb-6 text-sm font-semibold text-gray-600">
                  {listingItem.observacion}
                </p>
                <br />
                <div className="absolute bottom-2 left-2 flex space-x-2">
                  <p className="m-0 text-xl font-bold">
                    {listingItem.cantidad} unidades
                  </p>
                </div>
              </div>
            </Link>
          </div>
          {/* Back of the card */}
          <div className="absolute inset-0 rounded-xl bg-white px-12 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="flex min-h-full w-full flex-col items-center justify-center  text-2xl font-semibold ">
              {/* Display listing information here */}
              <p>{listing.nombre}</p>
              <Link
                to={`/listing/${listingId}/${id}`}
                className="mt-4 rounded-3xl bg-green-600 px-4 py-2 text-white transition duration-500 ease-in-out hover:bg-green-800"
              >
                Ver detalles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
