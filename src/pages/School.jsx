import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import PhotoAlbum from "react-photo-album";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { MdLocationPin } from "react-icons/md";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function School() {
  const params = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(-1);
  const storage = getStorage();

  useEffect(() => {
    async function fetchSchool() {
      try {
        const docRef = doc(db, "escuelas", params.schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchool(docSnap.data());
          setLoading(false);
          console.log("Document data:", docSnap.data());
          if (docSnap.data().imgUrls) {
            const photos = await Promise.all(
              docSnap.data().imgUrls.map(async (imgUrl) => {
                const imageRef = ref(storage, imgUrl);
                const url = await getDownloadURL(imageRef);
                const img = new Image();
                img.src = url;
                await img.decode();
                return {
                  src: url,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                };
              })
            );
            setPhotos(photos);
          }
        } else {
          console.log("No such document!");
          toast.error("No se encontró la escuela");
        }
      } catch (error) {
        console.error("Error getting document:", error);
        toast.error("Error al obtener la escuela");
      }
    }
    fetchSchool();
  }, [params.schoolId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <main>
      <div className="m-4 flex max-w-6xl flex-col rounded-xl bg-white p-4 shadow-lg md:flex-row lg:mx-auto lg:space-x-5">
        <div className="lg-[400px] h-[200px] w-full">
          <p className="text-2xl font-bold text-[#9d4545]">{school.nombre}</p>
          <p className="text-sm font-semibold text-gray-700">
            {school.distrito}, {school.departamento}
          </p>
          {/* TODO: Add descripcion here and in the CreateSchool and EditSchool components */}
          <div className="mt-6 flex items-center space-x-1">
            <MdLocationPin className="h-4 w-4 text-green-600" />
            <p className="text-sm font-semibold text-gray-700">
              {school.direccion}
            </p>
          </div>
          {school.barrio && (
            <div className="mt-2 flex items-center space-x-1">
              <p className="text-sm font-semibold text-gray-700">Barrio:</p>
              <p className="text-sm font-semibold text-gray-700">
                {school.barrio}
              </p>
            </div>
          )}
          {/* TODO: Add zona here and in the CreateSchool and EditSchool components */}
          {/* TODO: Add teléfono here and in the CreateSchool and EditSchool components */}
          {/* TODO: Add email here and in the CreateSchool and EditSchool components */}
        </div>
        <div className="lg-[400px] z-10 h-[400px] w-full overflow-x-hidden">
          <MapContainer
            center={[school.latitud, school.longitud]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />
            <Marker
              draggable={false}
              position={[school.latitud, school.longitud]}
              eventHandlers={{
                click: () => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${school.latitud},${school.longitud}`;
                  window.open(mapsUrl, "_blank");
                },
              }}
            />
          </MapContainer>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl px-3">
        <PhotoAlbum
          layout="masonry"
          photos={photos}
          renderPhoto={({ renderDefaultPhoto }) => (
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor: "rgba(255 255 255 / .6)",
                inset: "auto 0 0 0",
                padding: 8,
                margin: 3,
                boxShadow: "5px 5px 12px rgba(0 0 0 / .5)",
              }}
            >
              {renderDefaultPhoto({ wrapped: true })}
            </div>
          )}
          onClick={({ index }) => setIndex(index)}
        />
        <Lightbox
          slides={photos}
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
          zoom={{
            scrollToZoom: true,
            maxZoomPixelRatio: 2,
          }}
        />
      </div>
    </main>
  );
}
