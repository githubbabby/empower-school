import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";
import Spinner from "../components/Spinner";
import SchoolItem from "../components/SchoolItem";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [schools, setSchools] = useState([]);
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
      let schools = [];

      querySnapshot.forEach((doc) => {
        return schools.push({ id: doc.id, data: doc.data() });
      });
      setSchools(schools);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function onEdit(schoolId) {
    navigate(`/edit-school/${schoolId}`);
  }

  if (loading) {
    return <Spinner />;
  }
  return (
    <div>
      {!loading && userRole === "schoolRep" && schools.length > 0 && (
        <div className="mx-auto mt-6 max-w-6xl px-3">
          <>
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Mis Escuelas
            </h2>
            <ul className="mb-6 mt-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {schools.map((school) => (
                <SchoolItem
                  key={school.id}
                  id={school.id}
                  school={school.data}
                  onEdit={() => onEdit(school.id)}
                />
              ))}
            </ul>
          </>
        </div>
      )}
      {userRole === "donor" && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Donante</h2>
          <p className="mt-6">Bienvenido donante</p>
        </div>
      )}
    </div>
  );
}
