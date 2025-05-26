// import { React, useRef, useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import "./NetworkDiagramMapView.scss";
// import * as go from "gojs";

// import {setDiagramLoader } from "../../../../redux/widgets/networkDiagram/networkDiagramAction";


// export default function NetworkDiagramMapView() {
//   const diagramRef = useRef(null);
//   const diagramInstance = useRef(null);
//   const dispatch = useDispatch();

//   // Get the model from Redux
//   const diagramModelData = useSelector(
//     (state) => state.networkDiagramReducer.diagramModelData
//   );
//   const isDiagramLoading = useSelector(
//     (state) => state.networkDiagramReducer.isDiagramLoadingIntial
//   );
//   const [loading, setLoading] = useState(true); // Add loading state

//   useEffect(() => {
// debugger
//     if (!diagramRef.current || diagramInstance.current) return;
//     const $ = go.GraphObject.make;

//     const diagram = $(go.Diagram, diagramRef.current, {
//       initialAutoScale: go.Diagram.Uniform,
//        layout: $(go.TreeLayout, {
//         angle: 90,
//         layerSpacing: 40,
//         nodeSpacing: 20,
//         alignment: go.TreeLayout.AlignmentCenterChildren,
//         setsPortSpot: false,
//         setsChildPortSpot: false,
//       }),
//       "undoManager.isEnabled": false,
//     });

//     diagram.nodeTemplateMap.add(
//       "container",
//       $(go.Node, "Auto",
//         $(go.Shape, "Rectangle", {
//           fill: "#e0f7fa",
//           stroke: "#006064",
//           strokeWidth: 2,
//           width: 100,
//           height: 40,
//         }),
//         $(go.TextBlock, {
//           margin: 8,
//           font: "bold 12px sans-serif",
//           wrap: go.TextBlock.WrapFit,
//           textAlign: "center",
//         }, new go.Binding("text", "label"))
//       )
//     );

//     diagram.nodeTemplateMap.add(
//       "junction",
//       $(go.Node, "Auto",
//         $(go.Shape, "Ellipse", {
//          fill: "#FAB38D", stroke: "#110e25",
//           strokeWidth: 1,
//           width: 15,
//           height: 15,
//         }),
//         $(go.TextBlock, {
//           margin: 4,
//           font: "10px sans-serif",
//           textAlign: "center",
//         })
//       )
//     );

//     diagram.nodeTemplate = $(go.Node, "Auto",
//       $(go.Shape, "RoundedRectangle", {
//         fill: "#c8e6c9",
//         stroke: "#2e7d32",
//         strokeWidth: 2,
//       }),
//       $(go.TextBlock, {
//         margin: 8,
//         font: "bold 11px sans-serif",
//         wrap: go.TextBlock.WrapFit,
//       }, new go.Binding("text", "label"))
//     );

//     diagram.linkTemplate =   $(go.Link,
//         {
//           routing: go.Link.AvoidsNodes,
//           curve: go.Link.JumpOver,
//           corner: 10
//         },
//       $(go.Shape, {
//     strokeWidth: 1,
//     stroke: "#110e25",
//     strokeDashArray: [6, 4]
//   }),
//       $(go.Shape, {
//         toArrow: "Standard",
//         stroke: "#110e25",
//         fill: "#110e25", scale: 0.6
//       }),
//       $(go.TextBlock, {
//         segmentOffset: new go.Point(0, -10),
//         font: "10px sans-serif",
//         stroke: "#333",
//       }, new go.Binding("text", "text"))
//     );

//     diagramInstance.current = diagram;
//   }, []);

//   // Load diagram model when it changes in Redux
//   useEffect(() => {  
//     debugger 
//     // setLoading(true); // Start loader
//     if(!diagramModelData) return  
//       try {
//         const model = go.Model.fromJson(diagramModelData);
//         diagramInstance.current.model = model;
//       } catch (err) {
//         console.error("Invalid diagram model JSON:", err);
//       }finally{
//                 dispatch(setDiagramLoader(false))

//       }
//   }, [diagramModelData]);

//   return (
//     <div className="map_view d-flex flex-column h-100 position-relative">
//       {/* {isDiagramLoading &&(
//         <div className="apploader_container apploader_container_widget">
//           <span className="apploader"></span>
//         </div>
//       )} */}
//         <div
//           ref={diagramRef}
//           style={{ width: "100%", height: "100%" }}
//           className="the_map flex-fill"
//         />
   
     
//     </div>
//   );
// }
//////////////////////////////////////////////////////
import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "./NetworkDiagramMapView.scss";
import * as ReactDOM from "react-dom";
import {
  createMap,
  createNetworkDiagramMapView,
} from "../../../../handlers/esriHandler";
import { setNetworkDiagramView } from "../../../../redux/widgets/networkDiagram/networkDiagramAction";
import exportIcon from "../../../../style/images/mg-map-tool-Export.svg";
import {
  getNetworkDiagramInfos,
  applyLayoutAlgorithm,
  makeRequest,
} from "../../networkDiagram/networkDiagramHandler";
export default function NetworkDiagramMapView() {
  // To use locales and directions
  const { t, i18n } = useTranslation("NetworkDiagramMapView");
  const direction = i18n.dir(i18n.language);

  // Hooks
  const dispatch = useDispatch();
  const view = useSelector((state) => state.networkDiagramReducer.networkDiagramViewIntial);

  // Used to track the map
  const mapRef = useRef(null);
  const exportDiagramButtonRef = useRef(null);

  // Selector to track the mapView
  const diagramExportUrl = useSelector(
    (state) => state.networkDiagramReducer.diagramExportUrlIntial
  );
  const token = useSelector(
    (state) => state.networkDiagramReducer.tokenIntial
  );
  // Selector to track the language
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  // const exportDiagram = async () => {
  //   if (diagramExportUrl) {
  //     let postJson = {
  //       size: "800,600",
  //       token: token,
  //       f: "json",
  //     };
  //     const response = await makeRequest({
  //       method: "POST",
  //       url: diagramExportUrl,
  //       params: postJson,
  //     });

  //     if (response?.href) {
  //       try {
  //         const fileResponse = await fetch(response.href);
  //         const blob = await fileResponse.blob();

  //         const url = URL.createObjectURL(blob);
  //         const a = document.createElement("a");
  //         a.href = url;
  //         a.download = "network_diagram.png"; // Or derive from response.href
  //         document.body.appendChild(a);
  //         a.click();
  //         document.body.removeChild(a);
  //         URL.revokeObjectURL(url); // Clean up after download
  //       } catch (err) {
  //         console.error("Download failed:", err);
  //       }
  //     }
  //   }
  // };
  // Effect to intaiting the mapview
  useEffect(() => {
    //function to initiating the mapview
    const initializeMap = async () => {
      try {
        // Check if mapRef.current exists
        if (!mapRef.current) {
          console.error(
            "mapRef.current is null. Map container is not available."
          );
          return;
        }
        // //craete the basemap
        const myMap = await createMap();
        const view = await createNetworkDiagramMapView({
          container: mapRef.current,
          map: myMap,
          extent: utilityNetwork.fullExtent,
        });
        view.when(async () => {
          // const navContainer = document.createElement("div");

          // const exportButton = document.createElement("button");
          // exportButton.classList.add("esri-widget--button");
          // exportButton.title = t("Export Diagram");

          // const exportImg = document.createElement("img");
          // exportImg.src = exportIcon;
          // exportImg.alt = "Export";
          // exportButton.appendChild(exportImg);

          // exportButton.addEventListener("click", () => {
          //   console.log("Prev button clicked");
          //   exportDiagram();
          // });
          // exportDiagramButtonRef.current = exportButton;

          // navContainer.appendChild(exportButton);
          // view.ui.add(navContainer, "bottom-left");

          //dispatch the view to the store
          dispatch(setNetworkDiagramView(view));
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();
  }, []);

  return (
    <>
      <div
        className={`map_view d-flex flex-column h-100 position-relative h-100 `}
      >
        <div
          ref={mapRef}
          style={{ width: "100%", height: "100%", backgroundColor :"white" }}
          className="the_map flex-fill"
        />
      </div>
    </>
  );
}