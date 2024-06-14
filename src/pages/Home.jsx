import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  updateDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../firebase.config";
import Spinner from "../components/Spinner";
import SchoolItem from "../components/SchoolItem";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export default function Home() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [schools, setSchools] = useState([]);
  const [listings, setListings] = useState([]);
  const [userSchools, setUserSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
          if (userSnap.data().role === "schoolRep") {
            await fetchUserSchools(user.uid);
          } else if (userSnap.data().role === "donor") {
            await fetchSchools();
            await fetchListings();
          }
        } else {
          console.error("No user data available");
        }
        setLoading(false);
      } else {
        // Handle the case where no user is signed in
      }
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  async function fetchUserSchools(uid) {
    try {
      const SchoolRef = collection(db, "escuelas");
      const q = query(
        SchoolRef,
        where("id_usuario", "==", uid),
        orderBy("fecha_creacion", "desc")
      );
      const querySnapshot = await getDocs(q);
      let userSchools = [];

      const schoolPromises = querySnapshot.docs.map(async (doc) => {
        let userSchool = { id: doc.id, data: doc.data(), institutes: [] };

        const InstitutesRef = collection(doc.ref, "institutos");
        const institutesSnapshot = await getDocs(InstitutesRef);
        institutesSnapshot.forEach((instituteDoc) => {
          userSchool.institutes.push({
            id: instituteDoc.id,
            data: instituteDoc.data(),
          });
        });

        return userSchool;
      });

      userSchools = await Promise.all(schoolPromises);

      setUserSchools(userSchools);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function fetchSchools() {
    try {
      const SchoolRef = collection(db, "escuelas");
      const q = query(SchoolRef, orderBy("fecha_creacion", "desc"));
      const querySnapshot = await getDocs(q);
      let schools = [];

      const fetchInstitutesPromises = querySnapshot.docs.map(async (doc) => {
        let school = { id: doc.id, data: doc.data(), institutes: [] };

        const InstitutesRef = collection(doc.ref, "institutos");
        const institutesSnapshot = await getDocs(InstitutesRef);
        institutesSnapshot.forEach((instituteDoc) => {
          school.institutes.push({
            id: instituteDoc.id,
            data: instituteDoc.data(),
          });
        });

        return school;
      });

      schools = await Promise.all(fetchInstitutesPromises);

      setSchools(schools);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function fetchListings() {
    try {
      const ListingRef = collection(db, "pedidos");
      const q = query(
        ListingRef,
        where("estado", "==", "pendiente"),
        orderBy("fecha_creacion", "asc"),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      let listings = [];

      const fetchListingItemsPromises = querySnapshot.docs.map(async (doc) => {
        let listing = { id: doc.id, data: doc.data(), listingItems: [] };

        const ListingItemsRef = collection(doc.ref, "articulos");
        const listingItemsSnapshot = await getDocs(ListingItemsRef);
        listingItemsSnapshot.forEach((listingItemDoc) => {
          listing.listingItems.push({
            id: listingItemDoc.id,
            data: listingItemDoc.data(),
          });
        });

        return listing;
      });

      listings = await Promise.all(fetchListingItemsPromises);

      setListings(listings);
      console.log(listings);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function onEdit(schoolId) {
    navigate(`/edit-school/${schoolId}`);
  }

  async function onDelete(schoolId) {
    if (window.confirm("Esta seguro de eliminar esta escuela?")) {
      try {
        const docRef = doc(db, "escuelas", schoolId);
        await updateDoc(docRef, {
          eliminado: true,
          fecha_eliminacion: serverTimestamp(),
        });
        setUserSchools((prevState) =>
          prevState.filter((userSchool) => userSchool.id !== schoolId)
        );
        toast.success("Escuela eliminada con exito");
      } catch (error) {
        toast.error(error.message);
      }
    }
  }

  const MapWithMarkers = () => {
    const map = useMap();

    useEffect(() => {
      const markers = L.markerClusterGroup();

      schools.forEach((school) => {
        if (school.data.latitud && school.data.longitud) {
          const marker = L.marker([
            school.data.latitud,
            school.data.longitud,
          ]).bindPopup(`<b>${school.data.nombre}</b>`);
          markers.addLayer(marker);
        }
      });

      map.addLayer(markers);

      return () => {
        map.removeLayer(markers);
      };
    }, [map, schools]);

    return null;
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      {!loading && userRole === "schoolRep" && userSchools.length > 0 && (
        <div className="mx-auto mt-6 max-w-full px-3">
          <>
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Mis Escuelas
            </h2>
            <ul className="mb-6 mt-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {userSchools.map((userSchool) => (
                <SchoolItem
                  key={userSchool.id}
                  id={userSchool.id}
                  userSchool={userSchool.data}
                  institutes={userSchool.institutes}
                  onEdit={() => onEdit(userSchool.id)}
                  onDelete={() => onDelete(userSchool.id)}
                />
              ))}
            </ul>
          </>
        </div>
      )}

      {!loading && userRole === "donor" && (
        <>
          <div>
            <MapContainer
              center={[-25.2637, -57.5759]}
              zoom={10}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              <MapWithMarkers />
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
}
