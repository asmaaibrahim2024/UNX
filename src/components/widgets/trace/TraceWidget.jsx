import { React, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./TraceWidget.scss";
import TraceInput from "./traceInput/TraceInput";
import TraceResult from "./traceResult/TraceResult";
import {
  loadFeatureLayers
} from "../../../handlers/esriHandler";
import {
  setTraceConfigurations,
  // setUtilityNetworkServiceUrl,
  // setUtilityNetworkSpatialReference,
  // setAssetsData,setUtilityNetwork,setLayersData
} from "../../../redux/widgets/trace/traceAction";



export default function TraceWidget({ isVisible }) {

   const utilityNetworkSelector = useSelector((state) => state.traceReducer.utilityNetworkIntial);
  // const webMapSelector = useSelector((state) => state.mapViewReducer.intialWebMap);
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

      loadFeatureLayers(`${utilityNetworkSelector.networkServiceUrl}/traceConfigurations`).then((unTraceConfigs)=>{
        // Extract trace configurations
        const traceConfigurationsVar =
        unTraceConfigs.traceConfigurations.map((config) => ({
            title: config.name,
            globalId: config.globalId,
          }));
          console.log("Trace Configurations: ", traceConfigurationsVar);
          
        // Dispatch trace configurations to Redux store
        dispatch(setTraceConfigurations(traceConfigurationsVar));
      })
    }
  }, [utilityNetworkSelector]);



// //To Remove (in MapView)
//   const getAllLayers = async (utilityNetwork) => {
//     try {
//       const serviceInfo = await loadFeatureLayers(utilityNetwork.featureServiceUrl)
//       console.log(serviceInfo,"serviceInfo");
      
//        return serviceInfo.layers;
//     } catch (error) {
//       console.error("Error fetching layers:", error);
//       return [];
//     }
//   };




  if (!isVisible) return null;


  return <>
     <div className="trace-widget">
      {/* Tab Buttons */}
      <div className="trace-tabs">
        <button
          className={`trace-tab ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
        >
          Trace Input
        </button>
        <button
          className={`trace-tab ${activeTab === "result" ? "active" : ""}`}
          onClick={() => setActiveTab("result")}
        >
          Trace Results
        </button>
      </div>

      {/* Display the selected component */}
      <div className="trace-content">
        {activeTab === "input" ? 
        // <TraceInput /> 
        <TraceInput
          isSelectingPoint={isSelectingPoint}
          setIsSelectingPoint={setIsSelectingPoint}
          mapClickHandlerRef={mapClickHandlerRef}
        />
        : <TraceResult />}
      </div>
    </div>
  </>;
}
