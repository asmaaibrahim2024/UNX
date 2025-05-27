import "./App.css";
import Layout from "./components/layout/Layout";
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n/i18n";
import { useHeaderLanguage } from "./handlers/languageHandler";
import { AuthService } from "../src/handlers/authHandlers/authServiceHandler"; // Import your AuthService
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../src/redux/layout/layoutAction";
import { setToken } from "../src/redux/widgets/networkDiagram/networkDiagramAction";

import ProtectedRoute from "./components/layout/ProtectedPage"; // Import the wrapper
import NotFound404 from "./components/layout/NotFound404";
import { generateTokenFromPortal } from "./components/widgets/networkDiagram/networkDiagramHandler";
function App() {
  const dispatch = useDispatch();

  useHeaderLanguage({
    lang: i18n.language,
    dir: i18n.dir(i18n.language),
  });
// useEffect(()=>{
//   generateTokenFromPortal(window.appConfig.apiServer.tokenUrl, "Utility.owner", "Pa$$w0rd@QSIT")
//   .then(token => {
//     console.log("Token received:", token);
//   })
//   .catch(err => {
//     console.error("Error fetching token:", err);
//   });
// },[])
  //uncomment the following to activate authHandlers
  useEffect(() => {
    // debugger;
      generateTokenFromPortal(window.appConfig.apiServer.tokenUrl, "Utility.owner", "Pa$$w0rd@QSIT")
  .then(token => {
    // console.log("Token received:", token);
    dispatch(setToken(token))
  })
  .catch(err => {
    console.error("Error fetching token:", err);
  });
    // Call your auth function on app startup
    AuthService.getUserByUniqueId()
      .then((user) => {
        dispatch(setUserData(user));
        // console.log("User info:", user);
      })
      .catch((err) => {
        console.error("Failed to get user:", err);
      });
  }, []);
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Layout />} />
        </Routes> 
        {/*uncomment the following to activate role guard*/}
        {/* <Routes>
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          />
          <Route path="/error/500" element={<NotFound404 />} />
        </Routes> */}
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
