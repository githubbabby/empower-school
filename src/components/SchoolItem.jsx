import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { MdLocationPin } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";

export default function SchoolItem({
  userSchool,
  institutes,
  id,
  onEdit,
  onDelete,
}) {
  if (userSchool.eliminado) return null;
  return (
    <li className="relative m-[10px] flex flex-col items-center justify-between overflow-hidden rounded-md bg-white shadow-md transition-shadow duration-150 hover:shadow-xl">
      <Link className="contents" to={`/school/${id}`}>
        <img
          className="transition-scale h-[170px] w-full object-cover duration-150 ease-in hover:scale-105"
          loading="lazy"
          src={userSchool.imgUrls[0]}
        />
        <div className="absolute left-2 top-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
          {dayjs(userSchool.fecha_creacion?.toDate()).fromNow()}
        </div>

        <div className="w-full p-[10px]">
          <div className="flex items-center space-x-1">
            <MdLocationPin className="h-4 w-4 text-green-600" />
            <p className="mb-[2px] truncate text-sm font-semibold text-gray-600">
              {userSchool.direccion}
            </p>
          </div>
          <p className="m-0 truncate text-xl font-semibold text-[#9d4545]">
            {userSchool.nombre}
          </p>
        </div>
      </Link>
      <button
        onClick={() => onEdit(id)}
        className="absolute bottom-2 right-7 p-1 text-gray-600 transition-colors duration-150 ease-in-out hover:text-gray-800"
      >
        <MdEdit />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="absolute bottom-2 right-2 p-1 text-gray-600 transition-colors duration-150 ease-in-out hover:text-red-800"
      >
        <FaRegTrashCan />
      </button>
      <ul>
        {institutes.map((institute) => (
          <li
            key={institute.id}
            className="relative m-[10px] overflow-hidden rounded-md border-2 border-[#f4c3c3] bg-white shadow-md transition-shadow duration-150 hover:shadow-xl"
          >
            <p>{institute.data.nombre_instituto}</p>
            <p>Turno: {institute.data.turno}</p>
          </li>
        ))}
      </ul>
    </li>
  );
}
