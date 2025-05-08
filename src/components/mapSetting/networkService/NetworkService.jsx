import { React, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import "./NetworkService.scss";
import { useDispatch, useSelector } from "react-redux";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import { connect } from "react-redux";
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
  setFeatureServiceLayers
 } from "../../../redux/mapSetting/mapSettingAction";

export default function NetworkService() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const utilityNetworkMapSetting = useSelector(
      (state) => state.mapSettingReducer.utilityNetworkMapSetting
    );

    
  const dispatch = useDispatch();

  const [utilityNetworkServiceUrl, setUtilityNetworkServiceUrl] = useState(utilityNetworkMapSetting? utilityNetworkMapSetting.layerUrl : "");
  const [diagramServiceUrl, setDiagramServiceUrl] = useState("");
  const [featureServiceUrl, setFeatureServiceUrl] = useState("");
  const [defaultBasemap, setDefaultBasemap] = useState("");
  const [connecting, setConnecting] = useState(false);



  useEffect(() => {
    const getNetworkService = async () => {
      try {
       const networkService = await fetchNetworkService();
      } catch (error) {
        console.error("Failed to fetch network service:", error);
      }
    };

    getNetworkService();
  }, []);

  
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };
  

  const connect = async () => {
    if (!isValidUrl(utilityNetworkServiceUrl)) {
      showErrorToast("Please enter a valid Utility Network Service URL. (https://yourserver/FeatureServer/networkLayerId)");
      return;
    }
    try {
      setConnecting(true);
      console.log("Connecting to: ", utilityNetworkServiceUrl);
      const utilityNetwork = await createUtilityNetwork(utilityNetworkServiceUrl);
      
      await utilityNetwork.load();
      if (utilityNetwork) {
        const featureService = await makeEsriRequest(utilityNetwork.featureServiceUrl);
        // Filter only Feature Layers
        const featureLayersOnly = featureService.layers.filter(
          (layer) => layer.type === "Feature Layer"
        );

        dispatch(setUtilityNetworkMapSetting(utilityNetwork));
        dispatch(setFeatureServiceLayers(featureLayersOnly));
        showSuccessToast("Connected to the utility network sucessfully");
        console.log("utilityNetwork", utilityNetwork);
        console.log("featureService", featureService);
        
      }
  } catch (error) {
    showErrorToast("Failed to connect. Please check the URL or network.");
    console.error("Connection error:", error);
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
