// import React, { useEffect, useState,useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { InputSwitch } from "primereact/inputswitch";
// import "./NetworkDiagram.scss";
// import { useI18n } from "../../../handlers/languageHandler";
// import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
// import { setNetworkDiagramSplitterVisiblity,setExportDiagramUrl,setDiagramModelData,setDiagramLoader } from "../../../redux/widgets/networkDiagram/networkDiagramAction";
// import close from "../../../style/images/x-close.svg";
// import diagramIcon from "../../../style/images/diagram.svg";
// import esri from "../../../style/images/esri.svg";
// import qsit from "../../../style/images/qsit.svg";
// import * as go from "gojs";
// import { getNetworkDiagramInfos } from "../networkDiagram/networkDiagramHandler";
// import { makeEsriRequest,makeEsriDiagramRequest } from "../../../handlers/esriHandler";
// export default function NetworkDiagram({ isVisible }) {
//   const { t, direction, dirClass, i18nInstance } = useI18n("NetworkDiagram");
//   const dispatch = useDispatch();
//   const $ = go.GraphObject.make;
//   const diagramRef = useRef(null);
//   const diagramInstance = useRef(null);
//   const isNetworkDiagramSplitterVisible = useSelector(
//     (state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible
//   );
//   const diagramModelData = useSelector(
//     (state) => state.networkDiagramReducer.diagramModelData
//   );
//   const token = useSelector(
//     (state) => state.networkDiagramReducer.tokenIntial
//   );
//   const utilityNetwork = useSelector(
//     (state) => state.mapSettingReducer.utilityNetworkMapSetting
//   );
//   const selectedFeatures = useSelector(
//     (state) => state.selectionReducer.selectedFeatures
//   );

//   const groupedTraceResultGlobalIds = useSelector(
//     (state) => state.traceReducer.groupedTraceResultGlobalIds
//   );

//   const [esriTemplates, setEsriTemplates] = useState([]);
//   const [templateSwitchStates, setTemplateSwitchStates] = useState({});
//   const [isGenerateReady, setIsGenerateReady] = useState(false);
//   const [globalIds, setGlobalIds] = useState(null);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [diagramServerUrl, setDiagramServerUrl] = useState(null);

// //!diagram intiation
//   // useEffect(() => {
//   //   if (!diagramRef.current || diagramInstance.current) return;

//   //   const diagram = $(go.Diagram, diagramRef.current, {
//   //     initialAutoScale: go.Diagram.Uniform,
//   //     layout: $(go.TreeLayout, {
//   //       angle: 90,
//   //       layerSpacing: 40,
//   //       nodeSpacing: 20
//   //     }),
//   //     "undoManager.isEnabled": true
//   //   });

//   //   diagram.nodeTemplateMap.add("container",
//   //     $(go.Node, "Auto",
//   //       { locationSpot: go.Spot.Center },
//   //       $(go.Shape, "Rectangle", {
//   //         fill: "#e0f7fa", stroke: "#006064", strokeWidth: 2, width: 100, height: 40
//   //       }),
//   //       $(go.TextBlock, {
//   //         margin: 8, font: "bold 12px sans-serif", wrap: go.TextBlock.WrapFit, textAlign: "center"
//   //       },
//   //         new go.Binding("text", "label"))
//   //     )
//   //   );

//   //   diagram.nodeTemplateMap.add("junction",
//   //     $(go.Node, "Auto",
//   //       $(go.Shape, "Ellipse", {
//   //         fill: "#FAB38D", stroke: "#110e25", strokeWidth: 1, width: 15, height: 15
//   //       }),
//   //       $(go.TextBlock, {
//   //         margin: 4, font: "10px sans-serif", textAlign: "center"
//   //       })
//   //     )
//   //   );

//   //   diagram.nodeTemplate =
//   //     $(go.Node, "Auto",
//   //       $(go.Shape, "RoundedRectangle", {
//   //         fill: "#c8e6c9", stroke: "#2e7d32", strokeWidth: 2
//   //       }),
//   //       $(go.TextBlock, {
//   //         margin: 8, font: "bold 11px sans-serif", wrap: go.TextBlock.WrapFit
//   //       },
//   //         new go.Binding("text", "label"))
//   //     );

//   //   diagram.linkTemplate =
//   //     $(go.Link,
//   //       { routing: go.Link.Orthogonal, corner: 10 },
//   //       $(go.Shape, {
//   //   strokeWidth: 1,
//   //   stroke: "#110e25",
//   //   strokeDashArray: [6, 4]
//   // }),
//   //       $(go.Shape, { toArrow: "Standard", stroke: "#110e25", fill: "#110e25", scale: 0.6 }),
//   //       $(go.TextBlock, {
//   //         segmentOffset: new go.Point(0, -10),
//   //         font: "10px sans-serif", stroke: "#333"
//   //       },
//   //         new go.Binding("text", "text"))
//   //     );

//   //   diagramInstance.current = diagram;
//   // }, []);

//  //!prepare diagram data 
//   function buildDiagramData(diagramContent) {
//     const nodes = [];
//     const links = [];

//     diagramContent.junctions.forEach((j) => {
//       nodes.push({
//         key: j.id,
//         label: j.id || `Junction ${j.id}`,
//         category: "junction"
//       });
//     });

//     diagramContent.containers.forEach((c) => {
//       nodes.push({
//         key: c.assocSourceID,
//         label: c.assocSourceID || `Container ${c.id}`,
//         category: "container"
//       });
//     });

//     diagramContent.edges.forEach((e) => {
//       links.push({
//         from: e.fromID,
//         to: e.toID
//       });
//     });

//     return { nodeDataArray: nodes, linkDataArray: links };
//   }
//   //!Load templates
//   useEffect(() => {
//     if (!utilityNetwork) return;

//     const url = utilityNetwork.networkServiceUrl.replace(
//       /\/UtilityNetworkServer\/?$/,
//       "/NetworkDiagramServer"
//     );
//     setDiagramServerUrl(url);

//     const loadTemplates = async () => {
//       const response = await getNetworkDiagramInfos(url);
//       if (response?.templates?.length) {
//         const configuredTemplates =
//           window.networkDiagramConfig?.Configurations?.esriTemplateNames || [];

//         const esriT = response.templates.filter((t) =>
//           configuredTemplates.includes(t)
//         );
//         const customT = response.templates.filter(
//           (t) => !configuredTemplates.includes(t)
//         );

//         setEsriTemplates(esriT);
//         // First template = true, others = false
//         const initialStates = {};
//         esriT.forEach((template, index) => {
//           initialStates[template] = index === 0;
//         });
//         setTemplateSwitchStates(initialStates);
//         setSelectedTemplate(esriT[0]);
//       }
//     };

//     loadTemplates();
//   }, [utilityNetwork]);
// //!create nd url
//   function createNetworkDiagramURL(baseURL, params) {
//     const url = new URL(baseURL);
//     Object.entries(params).forEach(([key, value]) => {
//       url.searchParams.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
//     });
//     return url.toString();
//   }
//   //!create diagram
//   const createDiagramFromFeatures = async () => {
//     if (selectedTemplate&& globalIds.length>0) {
//       dispatch(setDiagramLoader(true));


//       try {
//         const createUrl = `${diagramServerUrl}/createDiagramFromFeatures`;
//         const queryUrlBase = `${diagramServerUrl}/diagrams`;
  
// const diagramRes = await makeEsriDiagramRequest(createUrl, {
//   template: selectedTemplate,
//   initialFeatures: JSON.stringify(globalIds), // Make sure this is a JSON string
//   token,
//   gdbVersion: "",
//   sessionId: "",
// });
  
//         const contentRes = await makeEsriRequest(
//           createNetworkDiagramURL(
//             `${queryUrlBase}/${diagramRes.diagramInfo.name}/queryDiagramContent`,
//             { token }
//           )
//         );
  
//     const data = buildDiagramData(contentRes);

//           const model = new go.GraphLinksModel(data.nodeDataArray, data.linkDataArray);
//           diagramInstance.current = model;
//           // Save diagram to Redux
//           // debugger
//           // dispatch(setDiagramModelData(model.toJson()));
//           //        dispatch(setDiagramLoader(true))

//   const newModelJson = model.toJson();
//   const currentModelJson = diagramModelData;

//   // Always dispatch loader false eventually
//   dispatch(setDiagramModelData(newModelJson));

//   if (newModelJson !== currentModelJson) {
//     dispatch(setDiagramModelData(newModelJson));
//   } else {
//     // Model is the same, still need to manually stop loader
//     dispatch(setDiagramLoader(false));
//   }


//       } catch (error) {
//         console.error("Error creating diagram", error);
//       }
//     }
//   };

// //!handle switching templates
//   const handleSwitchChange = (selected) => {
//     const updatedStates = {};
//     esriTemplates.forEach((template) => {
//       updatedStates[template] = template === selected;
//     });
//     setTemplateSwitchStates(updatedStates);
//     setSelectedTemplate(selected);
//   };
//   //!Extract global IDs from selected features
//   useEffect(() => {
//     const selectedGlobalIds = selectedFeatures.flatMap((layerInfo) =>
//       layerInfo.features.map((f) => f.attributes.GLOBALID)
//     );

//     // Extract globalIds from groupedTraceResultGlobalIds (flatten all sets)
//     const traceGlobalIds = Object.values(groupedTraceResultGlobalIds).flatMap(
//       (gidSet) => Array.from(gidSet)
//     );

//     // Merge both and remove duplicates using a Set
//     const mergedUniqueGlobalIds = Array.from(
//       new Set([...selectedGlobalIds, ...traceGlobalIds])
//     );

//     setGlobalIds(mergedUniqueGlobalIds);
//   }, [selectedFeatures, groupedTraceResultGlobalIds]);

//   //!Enable/disable Generate button
//   useEffect(() => {
    
//     setIsGenerateReady(
//       !!diagramServerUrl && !!selectedTemplate && globalIds?.length > 0
//     );
//   }, [diagramServerUrl, selectedTemplate, globalIds]);
// const generateDiagram = async () => {
//   debugger
//        dispatch(setNetworkDiagramSplitterVisiblity(true))
//   // dispatch(triggerSplitRerender());
//     await  createDiagramFromFeatures()

// };
// const closeSubSidebarPanel = () => {
//     dispatch(setActiveButton(null));
//     dispatch(setNetworkDiagramSplitterVisiblity(false));
//   };

//   if (!isVisible) return null;

//   return (
  
//     <div className="subSidebar-widgets-container diagram-container">
//       <div className="subSidebar-widgets-header">
//         <div className="container-title">{t("generate Diagram")}</div>
//         <img
//           src={close}
//           alt="close"
//           className="cursor-pointer"
//           onClick={closeSubSidebarPanel}
//         />
//       </div>
//       <main className="subSidebar-widgets-body">
//         <div
//           className={`diagram_selection_block m_b_16 ${
//             (selectedTemplate) && "selected"
//           }`}
//         >
//           <h2 className="block_heading">
//             <img src={esri} alt="esri" height="16" />
//             <span className="m_l_8">{t("esri templates")}</span>
//           </h2>
//           <div className="block_options">
//             {esriTemplates.map((templateName) => (
//               <div
//                 className="form_group form_group_switch m_b_16"
//                 key={templateName}
//               >
//                 <InputSwitch
//                   checked={templateSwitchStates[templateName] || false}
//                   onChange={() => handleSwitchChange(templateName)}
//                   id={`switch-${templateName}`}
//                 />
//                 <label className="lbl" htmlFor={`switch-${templateName}`}>
//                   {t(templateName)}
//                 </label>
//               </div>
//             ))}
//           </div>
//         </div>
//       </main>
//       <div className="subSidebar-widgets-footer p_x_16">
//         <h2 className="diagram-footer-title">{t("Generate from Selection")}</h2>
//         <h3 className="diagram-footer-result">
//           <span className="m_r_4">{globalIds?.length}</span>
//           <span>{t("features has been selected")}</span>
//         </h3>
//         <button
//           className="btn_primary w-100 rounded_8"
//           onClick={generateDiagram}
//            disabled={!isGenerateReady}
//         >
//           <img src={diagramIcon} alt="diagram" height="16" />
//           {t("generate")}
//         </button>
//       </div>
//     </div>
//   );
// }

///////////////////////////////////////////
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputSwitch } from "primereact/inputswitch";
import "./NetworkDiagram.scss";
import { useI18n } from "../../../handlers/languageHandler";
import {
  getNetworkDiagramInfos,
  applyLayoutAlgorithm,
  makeRequest,
} from "../networkDiagram/networkDiagramHandler";
import {
  makeEsriRequest,
  displayNetworkDiagramHelper,  createMap,
  createNetworkDiagramMapView,makeEsriDiagramRequest,showErrorToast,getLayerIdBySourceId
} from "../../../handlers/esriHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { setNetworkDiagramSplitterVisiblity,setExportDiagramUrl,setDiagramLoader ,setNetworkDiagramView} from "../../../redux/widgets/networkDiagram/networkDiagramAction";
import close from "../../../style/images/x-close.svg";
import diagramIcon from "../../../style/images/diagram.svg";
import esri from "../../../style/images/esri.svg";
import qsit from "../../../style/images/qsit.svg";

export default function NetworkDiagram({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("NetworkDiagram");
  const dispatch = useDispatch();

  const isNetworkDiagramSplitterVisible = useSelector(
    (state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible
  );

  const token = useSelector(
    (state) => state.networkDiagramReducer.tokenIntial
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const view = useSelector((state) => state.networkDiagramReducer.networkDiagramViewIntial);
   // const view = useSelector((state) => state.mapViewReducer.intialView);
  
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const groupedTraceResultGlobalIds = useSelector(
    (state) => state.traceReducer.groupedTraceResultGlobalIds
  );

  const isDiagramLoading = useSelector(
    (state) => state.networkDiagramReducer.isDiagramLoadingIntial
  );

  const [esriTemplates, setEsriTemplates] = useState([]);
  const [templateSwitchStates, setTemplateSwitchStates] = useState({});

  const [networkTemplates, setNetworkTemplates] = useState([]);
  const [isGenerateReady, setIsGenerateReady] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(
    "SmartTreeDiagramLayout"
  );
  const [globalIds, setGlobalIds] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [diagramServerUrl, setDiagramServerUrl] = useState(null);
  const [diagramExportUrl, setDiagramExportUrl] = useState(null);
const [isGenerateClicked,setIsGenerateClicked]=useState(false)

  // Load templates
  useEffect(() => {
    if (!utilityNetwork) return;

    const url = utilityNetwork.networkServiceUrl.replace(
      /\/UtilityNetworkServer\/?$/,
      "/NetworkDiagramServer"
    );
    setDiagramServerUrl(url);

    const loadTemplates = async () => {
      const response = await getNetworkDiagramInfos(url);
      if (response?.templates?.length) {
        const configuredTemplates =
          window.networkDiagramConfig?.Configurations?.esriTemplateNames || [];

        const esriT = response.templates.filter((t) =>
          configuredTemplates.includes(t)
        );
        const customT = response.templates.filter(
          (t) => !configuredTemplates.includes(t)
        );
        // console.log(esriT, customT, "Mariam");

        setEsriTemplates(esriT);
        setNetworkTemplates(customT);
        // First template = true, others = false
        const initialStates = {};
        esriT.forEach((template, index) => {
          initialStates[template] = index === 0;
        });
        setTemplateSwitchStates(initialStates);
        setSelectedTemplate(esriT[0]);
      }
    };

    loadTemplates();
  }, [utilityNetwork]);

  const handleSwitchChange = (selected) => {
    const updatedStates = {};
    esriTemplates.forEach((template) => {
      updatedStates[template] = template === selected;
    });
    setTemplateSwitchStates(updatedStates);
    setSelectedTemplate(selected);
  };

  // Extract global IDs from selected features
  useEffect(() => {
    const selectedGlobalIds = selectedFeatures.flatMap((layerInfo) =>
      layerInfo.features.map((f) => f.attributes.GLOBALID)
    );

    // Extract globalIds from groupedTraceResultGlobalIds (flatten all sets)
    const traceGlobalIds = Object.values(groupedTraceResultGlobalIds).flatMap(
      (gidSet) => Array.from(gidSet)
    );

    // Merge both and remove duplicates using a Set
    const mergedUniqueGlobalIds = Array.from(
      new Set([...selectedGlobalIds, ...traceGlobalIds])
    );

    setGlobalIds(mergedUniqueGlobalIds);
  }, [selectedFeatures, groupedTraceResultGlobalIds]);

  // Enable/disable Generate button
  useEffect(() => {
    // console.log(diagramServerUrl,selectedTemplate,globalIds,"Maaaaaaaaaaaar");
    
    setIsGenerateReady(
      !!diagramServerUrl && !!selectedTemplate && globalIds?.length > 0
    );
  }, [diagramServerUrl, selectedTemplate, globalIds]);

  const buildUrlWithParams = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, val]) =>
      url.searchParams.append(key, Array.isArray(val) ? JSON.stringify(val) : val)
    );
    return url.toString();
  };

  const generateDiagram = async () => {
        dispatch(setNetworkDiagramSplitterVisiblity(true))
        setIsGenerateClicked(true)
         dispatch(setDiagramLoader(true))
  };
  const exportDiagram = async () => {
    if (diagramExportUrl) {
      let postJson = {
        size: "800,600",
        token: token,
        f: "json",
      };
      const response = await makeRequest({
        method: "POST",
        url: diagramExportUrl,
        params: postJson,
      });

      if (response?.href) {
        try {
          const fileResponse = await fetch(response.href);
          const blob = await fileResponse.blob();

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "network_diagram.png"; // Or derive from response.href
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url); // Clean up after download
        } catch (err) {
          console.error("Download failed:", err);
        }
      }
    }
  };
  const closeSubSidebarPanel = () => {
    dispatch(setActiveButton(null));
    dispatch(setNetworkDiagramSplitterVisiblity(false));
             dispatch(setExportDiagramUrl(null))
                     setIsGenerateClicked(false)
         dispatch(setDiagramLoader(false))

  };
useEffect(() => {
  // debugger
  if (!view?.map) return;
  if (isNetworkDiagramSplitterVisible && view?.map &&selectedTemplate&& globalIds?.length>0&&isGenerateClicked) {
    const fetchDiagram = async () => {
      // debugger
      const createUrl = `${diagramServerUrl}/createDiagramFromFeatures`;
      // const createParams = {
      //   template: selectedTemplate,
      //   initialFeatures: globalIds,
      //   token,
      // };
//         const createUrl = `${diagramServerUrl}/createDiagramFromFeatures`;
//         const queryUrlBase = `${diagramServerUrl}/diagrams`;
  

      try {
        // const fullCreateUrl = buildUrlWithParams(createUrl, createParams);
        // console.log(fullCreateUrl,"fullCreateUrl");
        const diagramRes = await makeEsriDiagramRequest(createUrl, {
  template: selectedTemplate,
  initialFeatures: JSON.stringify(globalIds), // Make sure this is a JSON string
  token,
  gdbVersion: "",
  sessionId: "",
});
console.log(diagramRes,"diagram Res");

        // const diagram = await makeEsriRequest(fullCreateUrl);
        const diagramName = diagramRes.diagramInfo.name;
        if (!diagramName) throw new Error("No diagram info returned.");
        //!to add later for interactions
//  let postJsonForQuery = {
//           token: this.token,
//           addDiagramInfo: false,
//           addGeometries: true,
//           addAttributes: true,
//           addAggregations: false,
//           useValueNames: true,
//           f: "json"
//         };
        const contentUrl = `${diagramServerUrl}/diagrams/${diagramName}/queryDiagramContent`;
        const content = await makeEsriRequest(
          buildUrlWithParams(contentUrl, { token })
        );
        const mapUrl = `${diagramServerUrl}/diagrams/${diagramName}/map`;
        const diagramInfo = await makeEsriRequest(
          `${diagramServerUrl}/diagrams/${diagramName}`
        );
        console.log(diagramInfo,"diagram diagramInfo");

const layoutParams ={
   "type": "PropertySet",
   "propertySetItems": [
    "tree_direction",
    1
   ]
  }
       const layoutres= await applyLayoutAlgorithm(
          `${diagramServerUrl}/diagrams`,
          token,
          selectedLayout,
          diagramName,
          [],
          [],
          [],
         JSON.stringify(layoutParams)
        );
        const exportUrl = await displayNetworkDiagramHelper(
          mapUrl,
          token,
          view,
          diagramInfo
        );

         console.log(layoutres, "diagram layout");

        // debugger
        if (exportUrl) {
         dispatch(setExportDiagramUrl(`${exportUrl}/export?f=image&size=800,600&token=${token}`))
        }
      } catch (err) {
              showErrorToast(t("Failed to generate network diagram"));
    dispatch(setNetworkDiagramSplitterVisiblity(false));
             dispatch(setExportDiagramUrl(null))
                     setIsGenerateClicked(false)
         dispatch(setDiagramLoader(false))
        console.error("Error generating network diagram:", err);
      }finally{
        setIsGenerateClicked(false)
         dispatch(setDiagramLoader(false))

      }
    };

    fetchDiagram();
  }
}, [
  view,
  isNetworkDiagramSplitterVisible,globalIds,selectedTemplate,isGenerateClicked
]);
const templateDescriptions = {
  Basic: t(`This is the default template used to generate diagrams. Use this template to generate basic diagrams from the network elements currently selected in the map. A diagram feature is created for each selected network element. Any content features or objects represented in the diagram receive a diagram feature to represent the container.`),
  ExpandContainers: t(`Use this template to generate diagrams with expanded containers represented by diagram polygon containers.`),
  CollapseContainers: t(`Use this template to generate diagrams with collapsed containers represented by collapsed diagram junctions and collapsed diagram edges. A single diagram line or point feature represents a container and its set of content.`),
};
  if (!isVisible) return null;

  return (
    <div className="subSidebar-widgets-container diagram-container">
      {isDiagramLoading && (
        <div className="apploader_container apploader_container_widget">
          <span className="apploader"></span>
        </div>
      )}
      <div className="subSidebar-widgets-header">
        <div className="container-title">{t("generate Diagram")}</div>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={closeSubSidebarPanel}
        />
      </div>
      <main className="subSidebar-widgets-body">
        <div
          className={`diagram_selection_block m_b_16 ${
            selectedTemplate && "selected"
          }`}
        >
          <h2 className="block_heading">
            <img src={esri} alt="esri" height="16" />
            <span className="m_l_8">{t("esri templates")}</span>
          </h2>
          <div className="block_options">
 {esriTemplates.length === 0 ? (
    <p>{t("There are no templates available")}</p>
  ) : (
    esriTemplates.map((templateName) => (
      <div
        className="form_group form_group_switch m_b_16"
        key={templateName}
title={templateDescriptions[templateName] || templateName}

      >
        <InputSwitch
          checked={templateSwitchStates[templateName] || false}
          onChange={() => handleSwitchChange(templateName)}
          id={`switch-${templateName}`}
        />
        <label className="lbl" htmlFor={`switch-${templateName}`}>
          {t(templateName)}
        </label>
      </div>
    ))
  )}
          </div>
        </div>
      </main>
      <div className="subSidebar-widgets-footer p_x_16">
        <h2 className="diagram-footer-title">{t("Generate from Selection")}</h2>
        <h3 className="diagram-footer-result">
          <span className="m_r_4">{globalIds?.length}</span>
          <span>{t("features has been selected")}</span>
        </h3>
        <button
          className="btn_primary w-100 rounded_8"
          onClick={generateDiagram}
          disabled={!isGenerateReady}
        >
          <img src={diagramIcon} alt="diagram" height="16" />
          {t("generate")}
        </button>
      </div>
    </div>
  );
}
