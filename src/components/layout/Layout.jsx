import React, { useState, useEffect } from "react";
import "./Layout.scss";
import { Layout } from "antd";
import { Toaster } from "react-hot-toast";
import Sidebar from "../sidebar/Sidebar";
import Header from "../home/header/Header";
import MapContainer from "../mapContainer/MapContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNetworkService,
  createUtilityNetwork,
  showErrorToast,
  fetchNetowkrService,
} from "../../handlers/esriHandler";
import {
  setNetworkServiceConfig,
  setUtilityNetworkMapSetting,
} from "../../redux/mapSetting/mapSettingAction";
//  import { useTranslation } from "react-i18next";
import { useI18n } from "../../handlers/languageHandler";
import { SketchVMProvider } from "./sketchVMContext/SketchVMContext";
import ShowProperties from "../commonComponents/showProperties/ShowProperties";
import ShowAttachment from "../commonComponents/showAttachment/ShowAttachment";
import ShowContainment from "../commonComponents/showContainment/ShowContainment";
const { Content } = Layout;
const AppLayout = () => {
  //  const { t, i18n,dir } = useTranslation("Layout");
  // const direction = i18n.dir(i18n.language);
  const { t, direction, dirClass } = useI18n("Layout");
  const [loading, setLoading] = useState(false);
  const [isNetworkService, setIsNetworkService] = useState(null);

  const showPropertiesFeature = useSelector(
    (state) => state.showPropertiesReducer.showPropertiesFeature
  );

  const showAttachmentFeature = useSelector(
    (state) => state.showAttachmentReducer.parentFeature
  );

  const isContainmentVisible = useSelector(
    (state) => state.showContainmentReducer.isContainmentVisible
  );

  const showContainmentFeature = useSelector(
    (state) => state.showContainmentReducer.parentFeature
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const appInit = async () => {
      try {
        setLoading(true);

        // const networkService = await fetchNetowkrService(8); // Fetch from deployed DB
        const networkService = await fetchNetworkService(); // Test DB
        // const networkService = null;
        if (networkService) {
          const utilityNetwork = await createUtilityNetwork(
            networkService.serviceUrl
          );
          await utilityNetwork.load();
          dispatch(setNetworkServiceConfig(networkService));
          dispatch(setUtilityNetworkMapSetting(utilityNetwork));
          setIsNetworkService(true);
          console.log("Network Service from DB -- AppInit:", networkService);
        } else {
          setLoading(false);
          setIsNetworkService(false);
        }
      } catch (error) {
        console.error("Failed to fetch network service:", error);
        showErrorToast(`Failed to fetch network service: ${error}`);
        setLoading(false);
        // yet to be handled
        // only open help tab -- cannot even open map setting
      }
    };

    appInit();
  }, []);

  return (
    <div dir={direction} className="app-layout">
      {loading && (
        <div className="loading-overlay">
          {/* <div className="loading-spinner">Loading...</div> */}
          {/* <span className="loader"></span> */}
          <div className="apploader_container">
            <span className="apploader"></span>
          </div>
        </div>
      )}
      <SketchVMProvider>
        <Header />
        <div className="sidebar-container">
          <Sidebar isNetworkService={isNetworkService} />
          <div className="map-container">
            <MapContainer setLoading={setLoading} />
          </div>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
        {/* {console.log(showPropertiesFeature)} */}
        {showPropertiesFeature && (
          <ShowProperties feature={showPropertiesFeature} />
        )}
        {showAttachmentFeature && <ShowAttachment />}
        {showContainmentFeature && <ShowContainment />}
      </SketchVMProvider>
    </div>
  );
};

export default AppLayout;
