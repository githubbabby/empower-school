import React from "react";
import { FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";

const ListingsList = ({ listings, userRole }) => {
  return (
    <ul className="mb-6 mt-6 space-y-4">
      {listings.map((listing) => (
        <li key={listing.id} className="rounded-lg bg-white p-4 shadow-md">
          <div className="mb-2 flex items-center text-xl font-bold text-gray-900">
            {listing.data.nombre}
            {userRole === "schoolRep" && (
              <Link
                to={`/edit-listing/${listing.id}`}
                className="ml-2 text-blue-500 hover:underline"
              >
                <FaEdit />
              </Link>
            )}
          </div>
          <ul className="list-disc pl-5">
            {listing.listingItems.map((item) => (
              <li key={item.id} className="mb-2 text-lg font-semibold">
                <div className="rounded-lg bg-white p-4 shadow-inner">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-gray-700">Artículo:</span>{" "}
                      <Link
                        to={`/listing/${listing.id}/${item.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        {item.data.nombre_articulo}
                      </Link>
                      {item.data.estado === "concretado" && (
                        <span className="ml-2 rounded bg-green-200 px-2 py-1 text-xs font-semibold text-green-700">
                          Donado
                        </span>
                      )}
                      {item.data.estado === "en_proceso" && (
                        <span className="ml-2 rounded bg-yellow-200 px-2 py-1 text-xs font-semibold text-yellow-700">
                          En proceso
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-700">Cantidad:</span>{" "}
                      {item.data.cantidad}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

export default ListingsList;
