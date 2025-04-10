﻿import { React, useState, useEffect, useRef } from "react";
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
  


// //To Remove (in MapView)
//   useEffect(() => {
//     const loadUtilityNetwork = async () => {
//       if (webMapSelector && webMapSelector.utilityNetworks.items.length > 0) {
//         await webMapSelector.utilityNetworks.items[0].load();
//         setUtilityNetworkState(webMapSelector.utilityNetworks.items[0]);
//       }
//     };
  
//     loadUtilityNetwork();
//   }, [webMapSelector]);

// //To Remove (in MapView)
//   useEffect(()=>{
//     if(utilityNetworkSelector){
//       if(utilityNetworkSelector?.dataElement){

//         loadAssetsData(utilityNetwork).then((data) => {
            
//           dispatch(setAssetsData(data));
//         });
//       }
//     }
//   },[utilityNetworkSelector])
  
//   //To Remove
  useEffect(() => {
    if (utilityNetworkSelector) {


      loadFeatureLayers(`${utilityNetworkSelector.networkServiceUrl}/traceConfigurations`).then((unTraceConfigs)=>{

        console.log(unTraceConfigs,"unLayers");
        // Extract trace configurations
        const traceConfigurationsVar =
        unTraceConfigs.traceConfigurations.map((config) => ({
            title: config.name,
            globalId: config.globalId,
          }));
          console.log(traceConfigurationsVar,"traceConfigurations");
          
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


// //To Remove (in MapView)
//  const loadAssetsData = async (utilityNetwork) => {
//     try {
//       // Extract domain networks from the utility network data element
//       const domainNetworks = utilityNetwork.dataElement.domainNetworks;
//       let result = { domainNetworks: [] };
      
//       const layers = await getAllLayers(utilityNetwork);
//       dispatch(setLayersData(layers));

//       console.log('ALL LAYERSSSS', layers)
//       console.log('UTILITY DOMAIN NETWORKS', utilityNetwork.dataElement.domainNetworks)
  
//       // Map layer IDs to names for quick lookup
//       const layerMap = new Map(layers.map(layer => [layer.id, layer.name]));
  
//       domainNetworks.forEach((domainNetwork) => {
//         let domainNetworkObj = {
//           domainNetworkId: domainNetwork.domainNetworkId,
//           domainNetworkName: domainNetwork.domainNetworkName,
//           junctionSources: [],
//           edgeSources: []
//         };
  
//         // Extract Junction Sources
//         domainNetwork.junctionSources.forEach((junctionSource) => {
//           let junctionSourceObj = {
//             sourceId: junctionSource.sourceId,
//             layerId: junctionSource.layerId,
//             layerName: layerMap.get(junctionSource.layerId) || "Not A Feature Layer",
//             assetGroups: []
//           };
  
//           junctionSource.assetGroups.forEach((assetGroup) => {
//             let assetGroupObj = {
//               assetGroupCode: assetGroup.assetGroupCode,
//               assetGroupName: assetGroup.assetGroupName,
//               assetTypes: assetGroup.assetTypes.map((assetType) => ({
//                 assetTypeCode: assetType.assetTypeCode,
//                 assetTypeName: assetType.assetTypeName
//               }))
//             };
  
//             junctionSourceObj.assetGroups.push(assetGroupObj);
//           });
  
//           domainNetworkObj.junctionSources.push(junctionSourceObj);
//         });
  
  
//         // Extract Edge Sources
//         domainNetwork.edgeSources.forEach((edgeSource) => {
//           let edgeSourceObj = {
//             sourceId: edgeSource.sourceId,
//             layerId: edgeSource.layerId,
//             layerName: layerMap.get(edgeSource.layerId) || "Not A Feature Layer",
//             assetGroups: []
//           };
  
//           edgeSource.assetGroups.forEach((assetGroup) => {
//             let assetGroupObj = {
//               assetGroupCode: assetGroup.assetGroupCode,
//               assetGroupName: assetGroup.assetGroupName,
//               assetTypes: assetGroup.assetTypes.map((assetType) => ({
//                 assetTypeCode: assetType.assetTypeCode,
//                 assetTypeName: assetType.assetTypeName
//               }))
//             };
  
//             edgeSourceObj.assetGroups.push(assetGroupObj);
//           });
  
//           domainNetworkObj.edgeSources.push(edgeSourceObj);
//         });
  
  
//         result.domainNetworks.push(domainNetworkObj);
//       });
  
//       console.log("Assets Data", result);
  
//       return result;
//     } catch (error) {
//       console.error("Unexpected error while loading utility network assets data", error);
//       return null;
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
