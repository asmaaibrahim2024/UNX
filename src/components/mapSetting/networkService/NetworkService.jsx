import { React, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import "./NetworkService.scss";
import { useDispatch, useSelector } from "react-redux";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import {  
  createUtilityNetwork,
  makeEsriRequest,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  fetchNetworkService
} from "../../../handlers/esriHandler";
import { 
  setUtilityNetworkMapSetting,
  setNetworkServiceConfig,
  setFeatureServiceLayers,
  setNetworkLayersCache
 } from "../../../redux/mapSetting/mapSettingAction";
import {createNetworkServiceConfig, createNetworkService} from "../mapSettingHandler";


export default function NetworkService() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const utilityNetwork = useSelector(
      (state) => state.mapSettingReducer.utilityNetworkMapSetting
    );

    
  const dispatch = useDispatch();

  const [utilityNetworkServiceUrl, setUtilityNetworkServiceUrl] = useState(utilityNetwork? utilityNetwork.layerUrl : "");
  const [connecting, setConnecting] = useState(false);


  // User already have a utilityNetwork in DB but modifying Configurations 
  useEffect(() => {
    if(!utilityNetwork) {
      showInfoToast("Please configure your utility network!")
      return
    };
    // Get Network feature Service layers data up to date
    const getUtilityNetworkUptoDate = async () => {
      const featureService = await makeEsriRequest(utilityNetwork.featureServiceUrl);
      // Filter only Feature Layers
      const featureLayersOnly = featureService.layers.filter(
        (layer) => layer.type === "Feature Layer"
      );

      dispatch(setFeatureServiceLayers(featureLayersOnly));
    };

    getUtilityNetworkUptoDate();
  }, []);

  
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };
  

  // Connecting to a new utility network and saving its default configurations in DB
  const connect = async () => {
    if (!isValidUrl(utilityNetworkServiceUrl)) {
      showErrorToast("Please enter a valid Utility Network Service URL. (https://yourserver/FeatureServer/networkLayerId)");
      return;
    }

    // Sweet Alert
    const confirm = await Swal.fire({
      title: "Confirm Network Change",
      text: "You are about to connect to a new Utility Network. The current configuration will be removed. Do you want to continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Connect",
      cancelButtonText: "Cancel",
      width: '420px',
      customClass: {
        popup: 'swal2-popup-custom',
        title: 'swal2-title-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    });


     if (!confirm.isConfirmed) {
      return;
    }

     // Backup old network
    const backupUtilityNetwork = utilityNetwork;
    // Disable everything untill connect
    dispatch(setUtilityNetworkMapSetting(null));
    
    try {
      setConnecting(true);
      console.log("Connecting to: ", utilityNetworkServiceUrl);
      const newUtilityNetwork = await createUtilityNetwork(utilityNetworkServiceUrl);
      
      await newUtilityNetwork.load();
      if (newUtilityNetwork) {
        const featureServiceUrl = newUtilityNetwork.featureServiceUrl
        const featureService = await makeEsriRequest(featureServiceUrl);
        // Filter only Feature Layers
        const featureLayersOnly = featureService.layers.filter(
          (layer) => layer.type === "Feature Layer"
        );

        // Create the network service configss in DB by default valuesss - POST REQUEST
        const networkServiceConfigData = await createNetworkServiceConfig(featureLayersOnly, newUtilityNetwork);
        
        // If response failed or error showww error toast not sucesss
        try {
          const networkServiceConfigDataDB = await createNetworkService(networkServiceConfigData);
          
          dispatch(setNetworkLayersCache({}));
          dispatch(setNetworkServiceConfig(networkServiceConfigDataDB));
          dispatch(setUtilityNetworkMapSetting(newUtilityNetwork));
          dispatch(setFeatureServiceLayers(featureLayersOnly));
          
        } catch (error) {
          console.log(error);
          showErrorToast("Couldn't connect to this network service.");
           // Restore backup network
          if (backupUtilityNetwork) {
            dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
          }
          return;
        }
        

        showSuccessToast("Connected to the utility network sucessfully");
        
      }
  } catch (error) {
    showErrorToast("Failed to connect. Please check the URL or network.");
    console.error("Connection error:", error);
    // Restore backup network
    if (backupUtilityNetwork) {
      dispatch(setUtilityNetworkMapSetting(backupUtilityNetwork));
    }
  } finally {
    setConnecting(false);
  }
  };
  

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body">
        <div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Utility Network Layer Url")}</label>
            <InputText
              value={utilityNetworkServiceUrl}
              onChange={(e) => setUtilityNetworkServiceUrl(e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
        </div>
      </div>
      <div className="card-footer bg-transparent border-0">
        <div className="action-btns pb-2">
          <button className="reset">
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button className="trace" onClick={() => connect("network-Services")} disabled={connecting}>
            {connecting ? t("Connecting...") : t("Connect")}
          </button>
        </div>
      </div>
    </div>
  );
}
