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
import ListingCard from "../components/ListingCard";
import { Link } from "react-router-dom";

const calculateDrivingDistance = async (lat1, lng1, lat2, lng2) => {
  const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${
    import.meta.env.VITE_REACT_APP_GEOCODE_API_KEY
  }`;
  const body = {
    origin: { location: { latLng: { latitude: lat1, longitude: lng1 } } },
    destination: { location: { latLng: { latitude: lat2, longitude: lng2 } } },
    travelMode: "DRIVE",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distanceMeters / 1000;
    }
    console.error("Error fetching routes:", data);
    return null;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return null;
  }
};

const MapWithMarkers = ({ schools }) => {
  const map = useMap();

  useEffect(() => {
    const markers = L.markerClusterGroup();

    schools.forEach((school) => {
      if (school.data.latitud && school.data.longitud) {
        const marker = L.marker([
          school.data.latitud,
          school.data.longitud,
        ]).bindPopup(
          `<a href="/school/${school.id}" target="_blank"><b>${school.data.nombre}</b></a>`
        );
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

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [schools, setSchools] = useState([]);
  const [distance, setDistance] = useState(10);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [userSchools, setUserSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distances, setDistances] = useState({});
  const [matches, setMatches] = useState([]);
  const [donorData, setDonorData] = useState(null);
  const [listingData, setListingData] = useState(null);
  const [listingItemData, setListingItemData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          if (userSnap.data().role === "schoolRep") {
            await fetchUserSchools(user.uid);
            await fetchMatches(user.uid);
            setLoading(false);
          } else if (userSnap.data().role === "donor") {
            await fetchSchools();
            await fetchListings();
            setLoading(false);
          }
        } else {
          console.error("No user data available");
        }
      } else {
        navigate("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchDistances = async () => {
      if (!userData) return;

      const newDistances = {};

      for (const listing of listings) {
        if (!listing.data.latitud || !listing.data.longitud) continue;

        const listingPoint = {
          lat: listing.data.latitud,
          lng: listing.data.longitud,
        };
        const userPoint = { lat: userData.latitud, lng: userData.longitud };

        const dist = await calculateDrivingDistance(
          listingPoint.lat,
          listingPoint.lng,
          userPoint.lat,
          userPoint.lng
        );

        if (dist !== null) {
          newDistances[listing.id] = dist;
        }
      }

      setDistances(newDistances);
    };

    fetchDistances();
  }, [userData, listings]);

  useEffect(() => {
    const filterListings = () => {
      const newFilteredListings = listings.filter(
        (listing) => distances[listing.id] <= distance
      );
      setFilteredListings(newFilteredListings);
    };

    filterListings();
  }, [distance, distances, listings]);

  const fetchUserSchools = async (uid) => {
    try {
      const q = query(
        collection(db, "escuelas"),
        where("id_usuario", "==", uid),
        orderBy("fecha_creacion", "desc")
      );
      const querySnapshot = await getDocs(q);
      const userSchools = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const userSchool = { id: doc.id, data: doc.data(), institutes: [] };
          const institutesSnapshot = await getDocs(
            collection(doc.ref, "institutos")
          );
          institutesSnapshot.forEach((instituteDoc) => {
            userSchool.institutes.push({
              id: instituteDoc.id,
              data: instituteDoc.data(),
            });
          });
          return userSchool;
        })
      );
      setUserSchools(userSchools);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchMatches = async (uid) => {
    try {
      const q = query(
        collection(db, "matches"),
        where("estado", "==", "match_donante", "&&", "id_usuario", "==", uid),
        orderBy("fecha_creacion", "desc")
      );
      const querySnapshot = await getDocs(q);
      const matches = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const match = { id: doc.id, data: doc.data() };
          return match;
        })
      );
      setMatches(matches);
      console.log(matches);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchDonorData = async (id_donante) => {
    try {
      const donorDoc = await getDoc(doc(db, "users", id_donante));
      if (donorDoc.exists()) {
        setDonorData(donorDoc.data());
        setIsModalVisible(true);
      } else {
        console.error("No such donor!");
      }
    } catch (error) {
      console.error("Error fetching donor data:", error);
    }
  };

  const fetchListingData = async (id_pedido) => {
    try {
      const listingDoc = await getDoc(doc(db, "pedidos", id_pedido));
      if (listingDoc.exists()) {
        setListingData(listingDoc.data());
      } else {
        console.error("No such listing!");
      }
    } catch (error) {
      console.error("Error fetching listing data:", error);
    }
  };

  const fetchListingItemData = async (id_pedido, id_articulo) => {
    try {
      const listingItemDoc = await getDoc(
        doc(db, "pedidos", id_pedido, "articulos", id_articulo)
      );
      if (listingItemDoc.exists()) {
        setListingItemData(listingItemDoc.data());
      } else {
        console.error("No such listing item!");
      }
    } catch (error) {
      console.error("Error fetching listing item data:", error);
    }
  };

  const handleButtonClick = async (id_donante, id_pedido, id_articulo) => {
    await fetchDonorData(id_donante);
    await fetchListingData(id_pedido);
    await fetchListingItemData(id_pedido, id_articulo);
    setIsModalVisible(true);
  };

  const fetchSchools = async () => {
    try {
      const q = query(
        collection(db, "escuelas"),
        orderBy("fecha_creacion", "desc")
      );
      const querySnapshot = await getDocs(q);
      const schools = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const school = { id: doc.id, data: doc.data(), institutes: [] };
          const institutesSnapshot = await getDocs(
            collection(doc.ref, "institutos")
          );
          institutesSnapshot.forEach((instituteDoc) => {
            school.institutes.push({
              id: instituteDoc.id,
              data: instituteDoc.data(),
            });
          });
          return school;
        })
      );
      setSchools(schools);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchListings = async () => {
    try {
      const q = query(
        collection(db, "pedidos"),
        where("estado", "==", "pendiente"),
        orderBy("fecha_creacion", "asc")
      );
      const querySnapshot = await getDocs(q);
      const listings = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const listing = { id: doc.id, data: doc.data(), listingItems: [] };
          const listingItemsSnapshot = await getDocs(
            collection(doc.ref, "articulos")
          );
          listingItemsSnapshot.forEach((listingItemDoc) => {
            listing.listingItems.push({
              id: listingItemDoc.id,
              data: listingItemDoc.data(),
            });
          });
          return listing;
        })
      );
      setListings(listings);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onEdit = (schoolId) => navigate(`/edit-school/${schoolId}`);

  const onDelete = async (schoolId) => {
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
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      {userData.role === "schoolRep" && (
        <div className="mx-auto mt-6 max-w-full px-3">
          <div className="container flex max-w-xl flex-col items-center justify-center bg-white p-4 shadow-lg">
            {matches.map((match, index) => (
              <div key={index} className="mb-4 w-full">
                <p className="text-md text-center font-semibold">
                  Tiene un nuevo donante interesado en ayudar a su escuela
                </p>
                <div className="flex justify-center">
                  <button
                    className="text-md rounded bg-red-700 px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-red-900"
                    onClick={() =>
                      handleButtonClick(
                        match.data.id_donante,
                        match.data.id_pedido,
                        match.data.id_articulo
                      )
                    }
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}

            {isModalVisible && donorData && listingData && listingItemData && (
              <div
                id="default-modal"
                className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50"
              >
                <div className="relative max-h-full w-full max-w-4xl p-4">
                  <div className="relative rounded-lg bg-white shadow dark:bg-gray-700">
                    <div className="flex items-center justify-between rounded-t border-b p-4 dark:border-gray-600">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Datos del Donante y Pedido
                      </h3>
                      <button
                        type="button"
                        className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                        onClick={() => setIsModalVisible(false)}
                      >
                        <svg
                          className="h-3 w-3"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 14 14"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                          />
                        </svg>
                        <span className="sr-only">Close modal</span>
                      </button>
                    </div>
                    <div className="flex space-x-4 p-4">
                      <div className="w-1/2 space-y-4">
                        <h4 className="text-lg font-semibold">
                          Datos del Donante
                        </h4>
                        <p>Nombre: {donorData.nombre}</p>
                        <p>Apellido: {donorData.apellido}</p>
                        <p>C.I.: {donorData.ci}</p>
                        <p>Email: {donorData.email}</p>
                        <p>Telefono: {donorData.telefono}</p>
                        <p>Direccion: {donorData.direccion}</p>
                        <p>Ciudad: {donorData.distrito}</p>
                        <p>Departamento: {donorData.departamento}</p>
                      </div>
                      <div className="w-1/2 space-y-4">
                        <h4 className="text-lg font-semibold">
                          Datos del Pedido
                        </h4>
                        <p>Pedido: {listingData.nombre}</p>
                        <p>Descripcion: {listingData.descripcion}</p>
                        <h4 className="text-lg font-semibold">
                          Datos del Articulo
                        </h4>
                        <p>Nombre: {listingItemData.nombre_articulo}</p>
                        <p>Cantidad: {listingItemData.cantidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center rounded-b border-t border-gray-200 p-4 dark:border-gray-600">
                      <button
                        type="button"
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        onClick={() => setIsModalVisible(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <h2 className="mb-6 text-center text-2xl font-semibold">
            {userSchools.length === 0
              ? "No hay escuelas registradas"
              : "Mis Escuelas"}
          </h2>
          {userSchools.length === 0 ? (
            <button
              type="submit"
              className="mb-6 w-full rounded bg-red-700 px-4 py-2 text-xl text-white transition duration-300 ease-in-out hover:bg-red-900"
            >
              <Link
                to="/create-school"
                className="flex items-center justify-center"
              >
                Registrar escuela
              </Link>
            </button>
          ) : (
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
          )}
        </div>
      )}

      {userData.role === "donor" && (
        <>
          <div className="mx-auto mt-6 max-w-full px-3">
            <span className="px-3 text-base font-semibold">
              Quiero ver pedidos de escuelas en un radio de
              <select
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="mb-4 inline-block"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={450}>200</option>
              </select>
              kilometros
            </span>
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Pedidos de Escuelas
            </h2>
            <ul className="mb-6 mt-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredListings.map((listing) =>
                listing.listingItems.map((item) => (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    listingItem={item.data}
                    listingId={listing.id}
                    listing={listing.data}
                  />
                ))
              )}
            </ul>
          </div>
          <div className="mb-6 px-6">
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Mapa Escolar
            </h2>
            <MapContainer
              center={[-25.2637, -57.5759]}
              zoom={10}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              <MapWithMarkers schools={schools} />
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
}
