import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import PhotoAlbum from "react-photo-album";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

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
                await img.decode(); // Wait for the image to load
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
    <div className="mx-auto mt-6 max-w-6xl px-3">
      <div>
        <PhotoAlbum
          photos={photos}
          layout="masonry"
          onClick={({ index }) => setIndex(index)}
        />
        <Lightbox
          slides={photos}
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
        />
      </div>
    </div>
  );
}
