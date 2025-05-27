import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import MapView from "../mapView/MapView";
import NetworkDiagramMapView from "../widgets/networkDiagram/networkDiagramMapView/NetworkDiagramMapView";
import { Splitter, SplitterPanel } from "primereact/splitter";
import "./MapContainer.scss"

export default function MapContainer({ setLoading }) {
  const isNetworkDiagramSplitterVisible = useSelector(
    (state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible
  );
  const diagramModelData = useSelector(
    (state) => state.networkDiagramReducer.diagramModelData
  );
  
    const isDiagramLoading = useSelector(
      (state) => state.networkDiagramReducer.isDiagramLoadingIntial
    );
      const diagramExportUrl = useSelector(
        (state) => state.networkDiagramReducer.diagramExportUrlIntial
      );
  // useEffect(()=>{
  //   console.log(diagramModelData,"diagramModelData");
    
  // },[diagramModelData])
  // return (
  //   <Splitter className="h-100" style={{ height: "100%" }}>
  //     <SplitterPanel
  //       size={isNetworkDiagramSplitterVisible ? 50 : 100}
  //       className="flex align-items-center justify-content-center"
  //     >
  //       <MapView setLoading={setLoading} />
  //     </SplitterPanel>

  //     {/* Always render second panel */}
  //     <SplitterPanel
  //       size={isNetworkDiagramSplitterVisible ? 50 : 0}
  //       className="flex align-items-center justify-content-center"
  //       style={{
  //         overflow: "hidden",
  //         display: isNetworkDiagramSplitterVisible ? "block" : "none",
  //       }}
  //     >
  //             {isDiagramLoading &&(
  //       <div className="apploader_container apploader_container_widget">
  //         <span className="apploader"></span>
  //       </div>
  //     )}
  //      {diagramModelData&&<NetworkDiagramMapView />}
  //     </SplitterPanel>
  //   </Splitter>
  // );
//  return (
//     <>
//       {!isNetworkDiagramSplitterVisible ? (
//         <MapView setLoading={setLoading} />
//       ) : (
//         <Splitter className="h-100">
//           <SplitterPanel className="flex align-items-center justify-content-center">
//             <MapView setLoading={setLoading} />
//           </SplitterPanel>
//           <SplitterPanel className="flex align-items-center justify-content-center">
//             <NetworkDiagramMapView setLoading={setLoading} />
//           </SplitterPanel>
//         </Splitter>
//       )}
//     </>
//   );
    return (
    <Splitter className={`h-100 ${!isNetworkDiagramSplitterVisible && "defaultViewOfMap"}`} 
    style={{ height: "100%" }}>
      <SplitterPanel
        size={isNetworkDiagramSplitterVisible ? 50 : 100}
        className="flex align-items-center justify-content-center"
      >
        <MapView setLoading={setLoading} />
      </SplitterPanel>

      {/* Always render second panel */}
      <SplitterPanel
        size={isNetworkDiagramSplitterVisible ? 50 : 0}
        className="flex align-items-center justify-content-center"
        style={{
          overflow: "hidden",
          display: isNetworkDiagramSplitterVisible ? "block" : "none",
        }}
      >
  
       {isNetworkDiagramSplitterVisible&&<NetworkDiagramMapView />}
      </SplitterPanel>
    </Splitter>
  );
}
