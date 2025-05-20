import React, { useCallback, useEffect, useState } from "react";
import "./ShowConnection.scss";
import close from "../../../style/images/x-close.svg";
import fullScreen from "../../../style/images/extent.svg";
import notFullscreen from "../../../style/images/collapseExtent.svg";
import collapse from "../../../style/images/collapse.svg";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";
import {
  setConnectionVisiblity,
  setConnectionFullScreen,
} from "../../../redux/commonComponents/showConnection/showConnectionAction";
import { OrganizationChart } from "primereact/organizationchart";
import {
  addTablesToNetworkLayers,
  getConnectivityNodes,
  mergeNetworkLayersWithNetworkLayersCache,
} from "../../../handlers/esriHandler";
import { getSelectedPointTerminalId } from "../../widgets/trace/traceHandler";

const ShowConnection = () => {
  const dispatch = useDispatch();
  const { t, direction, dirClass, i18nInstance } = useI18n("ShowConnection");

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const isConnectionFullScreen = useSelector(
    (state) => state.showConnectionReducer.isConnectionFullScreen
  );

  // const data = useSelector((state) => state.showConnectionReducer.data);
  const parentFeature = useSelector(
    (state) => state.showConnectionReducer.parentFeature
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );
  const networkLayersCache = useSelector(
    (state) => state.mapSettingReducer.networkLayersCache
  );
  const layersAndTablesData = useSelector(
    (state) => state.mapViewReducer.layersAndTablesData
  );

  const [data, setData] = useState([]);

  // effect to load the data when the feature is changed
  useEffect(() => {
    const getConnectivityData = async () => {
      const networkLayers = mergeNetworkLayersWithNetworkLayersCache(
        networkService.networkLayers,
        networkLayersCache
      );
      //adding tables to networklayers
      // layersAndTablesData[0].tables.map((table) => {
      //   const layerUrlArr = networkLayers[0].layerUrl.split("/");
      //   layerUrlArr.pop();
      //   layerUrlArr.push(table.id);
      //   const layerUrl = layerUrlArr.join("/");

      //   networkLayers.push({
      //     layerId: table.id,
      //     layerUrl: layerUrl,
      //   });
      // });

      addTablesToNetworkLayers(layersAndTablesData[0].tables, networkLayers);
      console.log(networkLayers);

      const associationTypes = ["connectivity"];
      const ConnectivitiyData = await getConnectivityNodes(
        associationTypes,
        utilityNetwork,
        parentFeature,
        getSelectedPointTerminalId,
        networkLayers
      );

      setData(ConnectivitiyData);
    };

    getConnectivityData();
  }, [parentFeature]);

  const collapseAllNodes = (nodes) => {
    for (const node of nodes) {
      node.expanded = false;
      if (node.children && node.children.length > 0) {
        collapseAllNodes(node.children);
      }
    }
  };

  const handleCollapseAll = () => {
    const clonedData = JSON.parse(JSON.stringify(data)); // deep clone
    collapseAllNodes(clonedData);
    setData(clonedData); // triggers re-render
    console.log(data);
  };

  const nodeTemplate = (node) => {
    return (
      <div
        className={`p-organizationchart-node ${
          node.expanded ? "expanded-node" : ""
        }`}
      >
        <span>{node.label}</span>
      </div>
    );
  };

  return (
    <div
      className={`card card_connnection ${
        isConnectionFullScreen && "fullScreen"
      }`}
    >
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
        <span>{t("connection")}</span>
        <div>
          <img
            src={isConnectionFullScreen ? notFullscreen : fullScreen}
            alt="extent"
            className="cursor-pointer m_r_8"
            height={isConnectionFullScreen ? "24" : "16"}
            onClick={() =>
              dispatch(setConnectionFullScreen(!isConnectionFullScreen))
            }
          />
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => {
              dispatch(setConnectionVisiblity(false));
              dispatch(setConnectionFullScreen(false));
            }}
          />
        </div>
      </div>
      <div className="card-body p_16 overflow-auto">
        <div className="d-flex flex-column h-100">
          <div className="flex-shrink-0 d-flex justify-content-end m_b_24">
            {/* <button className="btn_secondary flex-shrink-0 m_r_8">
              <img src={reset} alt="reset" height="16" />
              <span>{t("reset")}</span>
            </button> */}
            <button
              className="btn_primary flex-shrink-0"
              on
              onClick={handleCollapseAll}
            >
              <img src={collapse} alt="collapse" height="16" />
              <span>{t("Collapse all")}</span>
            </button>
          </div>
          <div className="flex-fill overflow-auto">
            <div className="tree_diagram primereact-container">
              {data.length > 0 ? (
                <OrganizationChart value={data} nodeTemplate={nodeTemplate} />
              ) : (
                <div
                  className="loader-container"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "40px",
                  }}
                >
                  <div className="loader"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowConnection;
