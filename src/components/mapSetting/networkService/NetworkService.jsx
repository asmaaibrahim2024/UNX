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
  fetchNetworkService,
} from "../../../handlers/esriHandler";
import {
  setUtilityNetworkMapSetting,
  setNetworkServiceConfig,
  setFeatureServiceLayers,
  setNetworkLayersCache,
  setHasUnsavedChanges,
} from "../../../redux/mapSetting/mapSettingAction";
import {
  setTraceResultsElements,
  setSelectedTraceTypes,
  clearTraceSelectedPoints,
  setTraceConfigHighlights,
  setGroupedTraceResultGlobalIds,
  setQueriedTraceResultFeaturesMap,
} from "../../../redux/widgets/trace/traceAction";
import {
  createNetworkServiceConfig,
  createNetworkService,
  connectNetwork,
} from "../mapSettingHandler";
import { deleteAllTraceHistory } from "../../widgets/trace/traceHandler";
import {
  setExpandedGroups,
  setExpandedObjects,
  setExpandedTypes,
  setSelectedFeatures,
} from "../../../redux/widgets/selection/selectionAction";
import {
  setAttachmentParentFeature,
  setAttachmentVisiblity,
} from "../../../redux/commonComponents/showAttachment/showAttachmentAction";
import { setShowPropertiesFeature } from "../../../redux/commonComponents/showProperties/showPropertiesAction";
import {
  setConnectionFullScreen,
  setConnectionParentFeature,
  setConnectionVisiblity,
} from "../../../redux/commonComponents/showConnection/showConnectionAction";
import {
  setContainmentParentFeature,
  setContainmentVisiblity,
} from "../../../redux/commonComponents/showContainment/showContainmentAction";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { HasUnsavedChanges } from "../models/HasUnsavedChanges";
import { isEqual } from "lodash";

export default function NetworkService() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const dispatch = useDispatch();

  const [utilityNetworkServiceUrl, setUtilityNetworkServiceUrl] = useState(
    utilityNetwork ? utilityNetwork.layerUrl : ""
  );
  
  const [utilityNetworkServiceUrlBackup, setUtilityNetworkServiceUrlBackup] = useState(
    utilityNetwork ? utilityNetwork.layerUrl : ""
  );
  const [connecting, setConnecting] = useState(false);
const [resetDisabled, setResetDisabled] = useState(true);
  

  useEffect(() => {
    setUtilityNetworkServiceUrlBackup(utilityNetwork ? utilityNetwork.layerUrl : "");
  }, [utilityNetwork])

  // Tracks changes
  useEffect(() => {
    const isSame = isEqual(utilityNetworkServiceUrl, utilityNetworkServiceUrlBackup);

    const hasUnsavedChanges = new HasUnsavedChanges({
      tabName: "network-Services",
      isSaved: utilityNetworkServiceUrl === utilityNetworkServiceUrlBackup,
      backup: utilityNetworkServiceUrlBackup,
      tabStates: [
        t,
        isValidUrl,
        utilityNetworkServiceUrl,
        Swal,
        utilityNetwork,
        setUtilityNetworkMapSetting,
        dispatch,
        setConnecting,
        setNetworkLayersCache,
        setNetworkServiceConfig,
        setFeatureServiceLayers,
        resetPreviousData]
    });

    dispatch(setHasUnsavedChanges(hasUnsavedChanges));
    setResetDisabled(isSame);  // disable reset if no changes

  },[utilityNetworkServiceUrl, utilityNetworkServiceUrlBackup]);

  // User already have a utilityNetwork in DB but modifying Configurations
  useEffect(() => {
    if (!utilityNetwork) {
      showInfoToast(t("Please configure your utility network!"));
      return;
    }
    // Get Network feature Service layers data up to date
    const getUtilityNetworkUptoDate = async () => {
      try {
        const featureService = await makeEsriRequest(
          utilityNetwork.featureServiceUrl
        );
        // Filter only Feature Layers
        const featureLayersOnly = featureService.layers.filter(
          (layer) => layer.type === "Feature Layer"
        );

        const featureTables = featureService.tables;

        const allFeatureServiceLayers = [
          ...featureLayersOnly,
          ...featureTables,
        ];

        dispatch(setFeatureServiceLayers(allFeatureServiceLayers));
      } catch (e) {
        showErrorToast(
          `${t("Failed to fetch current network configurations ")}${e.message}`
        );
      }
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

  const resetPreviousData = async () => {
    // Trace
    dispatch(setTraceResultsElements(null));
    dispatch(clearTraceSelectedPoints());
    dispatch(setSelectedTraceTypes([]));
    dispatch(setGroupedTraceResultGlobalIds({}));
    dispatch(setQueriedTraceResultFeaturesMap({}));

    // selection
    dispatch(setSelectedFeatures([]));
    dispatch(setExpandedGroups([]));
    dispatch(setExpandedTypes([]));
    dispatch(setExpandedObjects([]));

    // show properties
    dispatch(setShowPropertiesFeature(null));

    // attachment
    dispatch(setAttachmentParentFeature(null));
    dispatch(setAttachmentVisiblity(false));

    // connectivity
    dispatch(setConnectionParentFeature(null));
    dispatch(setConnectionVisiblity(false));
    dispatch(setConnectionFullScreen(false));

    // containment
    dispatch(setContainmentParentFeature(null));
    dispatch(setContainmentVisiblity(null));

    // find
    // for the find it has a useEffect to clean it

    try {
      await deleteAllTraceHistory();
    } catch (e) {
      console.error("Could not delete trace history");
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
          <button 
            className={`reset ${resetDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setUtilityNetworkServiceUrl(utilityNetworkServiceUrlBackup)}
            disabled={resetDisabled}
            >
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button
            className="trace"
            // onClick={() => connect("network-Services")}
            
            onClick={() => connectNetwork(t,
                            isValidUrl,
                            utilityNetworkServiceUrl,
                            Swal,
                            utilityNetwork,
                            setUtilityNetworkMapSetting,
                            dispatch,
                            setConnecting,
                            setNetworkLayersCache,
                            setNetworkServiceConfig,
                            setFeatureServiceLayers,
                            resetPreviousData)}
            disabled={connecting}
          >
            {connecting ? t("Connecting...") : t("Connect")}
          </button>
        </div>
      </div>
    </div>
  );
}
