import { React, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./TraceWidget.scss";
import TraceInput from "./traceInput/TraceInput";
import TraceResult from "./traceResult/TraceResult";
import {
  makeEsriRequest,
  createGraphicsLayer,
  showErrorToast,
} from "../../../handlers/esriHandler";
import {
  setTraceConfigurations,
  setTraceGraphicsLayer,
} from "../../../redux/widgets/trace/traceAction";
import TraceHistory from "./traceHistory/TraceHistory";

export default function TraceWidget({ isVisible, setActiveButton }) {
  const utilityNetworkSelector = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("input");

  // const [utilityNetwork, setUtilityNetworkState] = useState(null);

  const [isSelectingPoint, setIsSelectingPoint] = useState({
    startingPoint: false,
    barrier: false,
  });

  // Optional: useRef to persist listener across tab switches
  const mapClickHandlerRef = useRef(null);

  useEffect(() => {
    if (utilityNetworkSelector) {
      const getTraceConfigurations = async () => {
        makeEsriRequest(
          `${utilityNetworkSelector?.networkServiceUrl}/traceConfigurations`
        ).then((unTraceConfigs) => {
          // Extract trace configurations
          const traceConfigurationsVar =
            unTraceConfigs?.traceConfigurations?.map((config) => ({
              title: config.name,
              globalId: config.globalId,
            }));
          // Dispatch trace configurations to Redux store
          dispatch(setTraceConfigurations(traceConfigurationsVar));
        });
      };

      const setupTraceGraphicsLayer = async () => {
        if (!viewSelector) return;
        try {
          // Add new graphics layer for results
          const traceResultsGraphicsLayer = await createGraphicsLayer({
            id: "traceGraphicsLayer",
            title: "Trace Graphics Layer",
          });
          viewSelector.map.add(traceResultsGraphicsLayer); // Add it to the Map
          dispatch(setTraceGraphicsLayer(traceResultsGraphicsLayer));
        } catch (e) {
          console.error(e);
          showErrorToast(`Cannot add Trace Graphics Layer: ${e}`);
        }
      };

      getTraceConfigurations();
      setupTraceGraphicsLayer();
    }
  }, [utilityNetworkSelector, viewSelector]);

  if (!isVisible) return null;

  return (
    <>
      <div className="trace-widget">
        {/* Display the selected component */}
        <div className="trace-content">
          {/* {activeTab === "input" ? 
        // <TraceInput /> 
        <TraceInput
          isSelectingPoint={isSelectingPoint}
          setIsSelectingPoint={setIsSelectingPoint}
          mapClickHandlerRef={mapClickHandlerRef}
          setActiveButton={setActiveButton}
          setActiveTab={setActiveTab}
        />
        : <TraceResult  setActiveTab={setActiveTab} setActiveButton={setActiveButton}/>} */}

          {activeTab === "input" && (
            <TraceInput
              isSelectingPoint={isSelectingPoint}
              setIsSelectingPoint={setIsSelectingPoint}
              mapClickHandlerRef={mapClickHandlerRef}
              setActiveButton={setActiveButton}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "result" && (
            <TraceResult
              setActiveTab={setActiveTab}
              setActiveButton={setActiveButton}
            />
          )}

          {activeTab === "history" && (
            <TraceHistory
              setActiveTab={setActiveTab}
              setActiveButton={setActiveButton}
            />
          )}
        </div>
      </div>
    </>
  );
}
