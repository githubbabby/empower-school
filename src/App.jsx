import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Schools from "./pages/Schools";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoute";
import School from "./pages/School";
import CreateSchool from "./pages/CreateSchool";
import EditSchool from "./pages/EditSchool";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";

function App() {
  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/create-school" element={<PrivateRoute />}>
            <Route path="/create-school" element={<CreateSchool />} />
          </Route>
          <Route path="/edit-school" element={<PrivateRoute />}>
            <Route path="/edit-school/:schoolId" element={<EditSchool />} />
          </Route>
          <Route path="/school/:schoolId" element={<School />} />
          <Route path="/create-listing" element={<PrivateRoute />}>
            <Route
              path="/create-listing/:instituteId"
              element={<CreateListing />}
            />
          </Route>
          <Route path="/edit-listing" element={<PrivateRoute />}>
            <Route path="/edit-listing/:listingId" element={<EditListing />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
