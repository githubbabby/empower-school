import React from "react";
import { Link } from "react-router-dom";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import { MdLocationPin } from "react-icons/md";

export default function SchoolItem({ school, id }) {
  dayjs.extend(relativeTime);

  return (
    <li className="relative m-[10px] flex flex-col items-center justify-between overflow-hidden rounded-md bg-white shadow-md transition-shadow duration-150 hover:shadow-xl">
      <Link className="contents" to={`/edit-school/${id}`}>
        <img
          className="transition-scale h-[170px] w-full object-cover duration-150 ease-in hover:scale-105"
          loading="lazy"
          src={school.imgUrls[0]}
        />
        <div className="absolute left-2 top-2 rounded-md bg-[#911a1a] px-2 py-1 text-xs font-semibold uppercase text-white shadow-lg">
          {dayjs(school.fecha_creacion?.toDate()).fromNow()}
        </div>

        <div className="w-full p-[10px]">
          <div className="flex items-center space-x-1">
            <MdLocationPin className="h-4 w-4 text-green-600" />
            <p className="mb-[2px] truncate text-sm font-semibold text-gray-600">
              {school.direccion}
            </p>
          </div>
          <p className="m-0 truncate text-xl font-semibold text-[#9d4545]">
            {school.nombre}
          </p>
        </div>
      </Link>
    </li>
  );
}
