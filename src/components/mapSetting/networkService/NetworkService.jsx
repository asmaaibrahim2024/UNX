import { React, useState } from "react";
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
} from "../../../handlers/esriHandler";
import { setUtilityNetwork } from "../../../redux/mapView/mapViewAction"; // To be removed
import { 
  // setUtilityNetwork,
  setFeatureServiceLayers
 } from "../../../redux/mapSetting/mapSettingAction";

export default function NetworkService() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [utilityNetworkServiceUrl, setUtilityNetworkServiceUrl] = useState("");
  const [diagramServiceUrl, setDiagramServiceUrl] = useState("");
  const [featureServiceUrl, setFeatureServiceUrl] = useState("");
  const [defaultBasemap, setDefaultBasemap] = useState("");

  const dispatch = useDispatch();
  
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
  
    console.log("User entered utility network service url: ", utilityNetworkServiceUrl);
    const utilityNetwork = await createUtilityNetwork(utilityNetworkServiceUrl);
    
    await utilityNetwork.load();
    if (utilityNetwork) {
      dispatch(setUtilityNetwork(utilityNetwork));
      console.log("utilityNetwork", utilityNetwork);


      const featureService = await makeEsriRequest(utilityNetwork.featureServiceUrl);
      console.log("featureService", featureService);
      dispatch(setFeatureServiceLayers(featureService.layers));
      
    }
  };
  

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body">
        <div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Utility Network Service")}</label>
            <InputText
              value={utilityNetworkServiceUrl}
              onChange={(e) => setUtilityNetworkServiceUrl(e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Diagram Service URL")}</label>
            <InputText
              value={diagramServiceUrl}
              onChange={(e) => setDiagramServiceUrl(e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Feature Service URL")}</label>
            <InputText
              value={featureServiceUrl}
              onChange={(e) => setFeatureServiceUrl(e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Default basemap")}</label>
            <InputText
              value={defaultBasemap}
              onChange={(e) => setDefaultBasemap(e.target.value)}
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
          <button className="trace" onClick={() => connect("network-Services")}>{t("Connect")}</button>
        </div>
      </div>
    </div>
  );
}
