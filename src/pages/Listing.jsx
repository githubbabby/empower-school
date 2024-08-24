import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import { MdLocationPin } from "react-icons/md";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { query, where, getDocs } from "firebase/firestore";

export default function Listing() {
  const params = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [listing, setListing] = useState(null);
  const [listingItem, setListingItem] = useState(null);
  const [school, setSchool] = useState(null);
  const [matchLmao, setMatchLmao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCommitted, setHasCommitted] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const newUserData = {
            ...userSnap.data(),
            uid: user.uid,
          };
          setUserData(newUserData);

          // Check commitment after setting user data
          const checkCommitment = async () => {
            const q = query(
              collection(db, "matches"),
              where("id_articulo", "==", params.listingItemId),
              where("id_donante", "==", user.uid),
              where("estado", "in", ["match_donante", "match_aceptado"])
            );

            const querySnapshot = await getDocs(q);
            setHasCommitted(!querySnapshot.empty);
          };

          checkCommitment();

          // Check match
          const q = query(
            collection(db, "matches"),
            where("id_articulo", "==", params.listingItemId),
            where("estado", "==", "match_aceptado")
          );

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            setMatchLmao({ id: doc.id, ...doc.data() });
          });
        } else {
          console.error("No user data available");
        }
      } else {
        navigate("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [navigate, params.listingItemId]);

  useEffect(() => {
    const fetchListingData = async () => {
      try {
        const docRef = doc(db, "pedidos", params.listingId);
        const listingSnap = await getDoc(docRef);

        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
          const schoolDocRef = doc(
            db,
            "escuelas",
            listingSnap.data().id_escuela
          );
          const schoolSnap = await getDoc(schoolDocRef);
          if (schoolSnap.exists()) {
            setSchool(schoolSnap.data());
          } else {
            console.log("No such document!");
            toast.error("No se encontró la escuela");
          }
        } else {
          console.log("No such document!");
          toast.error("No se encontró el pedido");
        }

        const docRefItem = doc(
          db,
          "pedidos",
          params.listingId,
          "articulos",
          params.listingItemId
        );
        const listingItemSnap = await getDoc(docRefItem);

        if (listingItemSnap.exists()) {
          setListingItem({ id: listingItemSnap.id, ...listingItemSnap.data() });
        } else {
          console.log("No such document!");
          toast.error("Error al obtener el pedido");
        }
      } catch (error) {
        console.error("Error getting documents:", error);
        toast.error("Error al obtener los pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [params.listingId, params.listingItemId]);

  const handleCommitment = async () => {
    try {
      const matchData = {
        id_pedido: params.listingId,
        id_articulo: params.listingItemId,
        id_establecimiento: listing.id_escuela,
        id_institucion: listing.id_instituto,
        id_donante: userData.uid,
        id_representante: listing.id_usuario,
        fecha_creacion: new Date(),
        estado: "match_donante",
      };

      await addDoc(collection(db, "matches"), matchData);

      toast.success("Compromiso registrado!");
      setHasCommitted(true);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to register commitment.");
    }
  };

  const handleDonation = async (matchId, listingId, listingItemId) => {
    try {
      // Update match document
      const matchDocRef = doc(db, "matches", matchId);
      await updateDoc(matchDocRef, {
        estado: "concretado",
        fecha_concretado: new Date(),
      });

      // Update listing item document
      const listingItemDocRef = doc(
        db,
        "pedidos",
        listingId,
        "articulos",
        listingItemId
      );
      await updateDoc(listingItemDocRef, {
        estado: "concretado",
      });

      // Add new document to donations collection
      const donationData = {
        id_pedido: listingId,
        id_articulo: listingItemId,
        id_establecimiento: listing.id_escuela,
        id_institucion: listing.id_instituto,
        id_donante: userData.uid,
        fecha_donacion: new Date(),
      };
      await addDoc(collection(db, "donaciones"), donationData);

      toast.success("Donación registrada!");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to register donation.");
    }
  };

  //Function to handle the cancellation of a by updating the match document and listingitem document
  const handleCancellation = async (matchId, listingId, listingItemId) => {
    try {
      // Update match document
      const matchDocRef = doc(db, "matches", matchId);
      await updateDoc(matchDocRef, {
        estado: "cancelado",
        fecha_cancelado: new Date(),
      });

      // Update listing item document
      const listingItemDocRef = doc(
        db,
        "pedidos",
        listingId,
        "articulos",
        listingItemId
      );
      await updateDoc(listingItemDocRef, {
        estado: "pendiente",
      });

      toast.success("Compromiso cancelado!");
      setHasCommitted(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to cancel commitment.");
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <main>
      <div className="m-4 flex max-w-6xl flex-col rounded-xl bg-white p-4 shadow-lg md:flex-row lg:mx-auto lg:space-x-5">
        <div className="lg-[400px] h-[200px] w-full">
          <p className="text-2xl font-bold text-[#9d4545]">{listing.nombre}</p>
          <p className="text-md font-semibold text-gray-600">
            Creado el:{" "}
            {listing.fecha_creacion.toDate().toLocaleDateString("es-PY")}
          </p>

          <p className="text-mb mt-6 font-semibold text-gray-700">
            {listing.observacion}
          </p>
          <div>
            <p className="mb-3 mt-9 text-sm font-semibold text-gray-700">
              {school.nombre}
            </p>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              <MdLocationPin className="inline text-green-600" />{" "}
              {school.direccion}
            </p>
            <p className="text-sm font-semibold text-gray-700">
              {school.distrito}, {school.departamento}
            </p>
          </div>
        </div>

        <div className="lg-[400px] z-10 h-[400px] w-full overflow-x-hidden">
          <MapContainer
            center={[listing.latitud, listing.longitud]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />
            <Marker
              draggable={false}
              position={[listing.latitud, listing.longitud]}
              eventHandlers={{
                click: () => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitud},${listing.longitud}`;
                  window.open(mapsUrl, "_blank");
                },
              }}
            />
          </MapContainer>
        </div>
      </div>
      <div className="m-4 mx-auto flex max-w-xl flex-col rounded-xl bg-white p-4 shadow-lg">
        <p className="text-lg font-semibold text-[#9d4545]">
          {listingItem.nombre_articulo}
        </p>
        <p className="text-md font-semibold text-gray-600">
          {listingItem.ingrediente} - {listingItem.categoria}
        </p>
        <p className="mt-6 text-sm font-semibold text-gray-700">
          {listingItem.observacion}
        </p>
        <div className="mt-6 flex items-center space-x-2">
          <p className="text-2xl font-bold">{listingItem.cantidad} unidades</p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        {userData.role === "donor" && !hasCommitted ? (
          <button
            onClick={handleCommitment}
            className="m-4 rounded-lg bg-green-700 p-2 font-semibold text-white hover:bg-green-900"
          >
            Quiero comprometerme a ayudar con este pedido 🤝
          </button>
        ) : userData.role === "donor" && hasCommitted ? (
          "Se ha comprometido con este articulo."
        ) : null}

        {userData.role === "schoolRep" &&
        listing.id_usuario === userData.uid ? (
          listingItem.estado === "en_proceso" && matchLmao ? (
            <>
              <button
                className="m-4 rounded-lg bg-pink-700 p-2 font-semibold text-white hover:bg-pink-900"
                onClick={() =>
                  handleDonation(matchLmao.id, listing.id, listingItem.id)
                }
              >
                Marcar como entregado 🚚
              </button>
              <button
                className="m-4 rounded-lg bg-purple-700 p-2 font-semibold text-white hover:bg-purple-900"
                onClick={() =>
                  handleCancellation(matchLmao.id, listing.id, listingItem.id)
                }
              >
                Cancelar compromiso 🚫
              </button>
            </>
          ) : listingItem.estado === "concretado" ? (
            <p className="m-4 font-semibold text-green-700">
              Este articulo ya fue donado
            </p>
          ) : null
        ) : null}
      </div>
    </main>
  );
}
