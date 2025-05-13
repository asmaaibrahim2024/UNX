import { React, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import "./NetworkDiagram.scss";
import { getNetworkDiagramInfos,applyLayoutAlgorithm } from "../networkDiagram/networkDiagramHandler";
import { makeEsriRequest ,displayNetworkDiagramHelper} from "../../../handlers/esriHandler";
// import * as go from "gojs";

export default function NetworkDiagram({ isVisible }) {
  // const $ = go.GraphObject.make;
  const diagramRef = useRef(null);
  const diagramInstance = useRef(null);
   let token= "yOTqF0pRkuNeVTjHfdgHxTXj94PZ7f_1zKPKntvS0Lwl5PO2ydi-9ioRqhorcqkZ_ZyCDT-efut59VarY4jkuqYcA-7e-RrfofMxZZQ24QX1UKnCirnUqgG5F0TGhNQbvvIPLFw9t3PF7ypafbxBrSWhuLMa1auMiHu4TXj71Os-Tdtfa24xOTU_4U-CCSdl"
    const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
    const view = useSelector((state) => state.mapViewReducer.intialView);
  
  const [esriTemplates, setEsriTemplates] = useState([]);
  const [networkTemplates, setNetworkTemplates] = useState([]);
  const [isGenerateReady, setIsGenerateReady] = useState(false);
  const currentSelectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const [globalIds, setGlobalIds] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [networkDiagramServerUrlState, setNetworkDiagramServerUrl] =
    useState(null);
//  // Setup diagram once
//   useEffect(() => {
//     if (!diagramRef.current || diagramInstance.current) return;

//     const diagram = $(go.Diagram, diagramRef.current, {
//       initialContentAlignment: go.Spot.Center,
//       layout: $(go.ForceDirectedLayout),
//       "undoManager.isEnabled": true,
//     });

//     diagram.nodeTemplate = $(
//       go.Node,
//       "Auto",
//       $(go.Shape, "RoundedRectangle", { fill: "lightblue", strokeWidth: 0 }),
//       $(
//         go.TextBlock,
//         { margin: 8, editable: false },
//         new go.Binding("text", "label")
//       )
//     );

//     diagram.linkTemplate = $(
//       go.Link,
//       { routing: go.Link.AvoidsNodes, curve: go.Link.Bezier, corner: 5 },
//       $(go.Shape),
//       $(go.Shape, { toArrow: "Standard" })
//     );

//     diagramInstance.current = diagram;
//   }, []);

//   // Build data for diagram
// function buildDiagramData(diagramContent) {
//   const nodes = [];
//   const links = [];

//   diagramContent.junctions.forEach((j) => {
//     nodes.push({
//       key: j.assocSourceID,
//       label: j.assocSourceID || `Junction ${j.id}`,
//     });
//   });

//   diagramContent.containers.forEach((c) => {
//     nodes.push({
//       key: c.assocSourceID,
//       label: c.assocSourceID || `Container ${c.id}`,
//     });
//   });

//   diagramContent.edges.forEach((e) => {
//     console.log(e, "edge"); // check each edge
//     links.push({
//       from: e.fromID,
//       to: e.toID,
//     });
//   });

//   return { nodeDataArray: nodes, linkDataArray: links };
// }

  useEffect(() => {
    if (!utilityNetwork) return;
    const networkDiagramServerUrl = utilityNetwork.networkServiceUrl.replace(
      /\/UtilityNetworkServer\/?$/,
      "/NetworkDiagramServer"
    );
    setNetworkDiagramServerUrl(networkDiagramServerUrl);
    const networkServerInfoInit = async (networkDiagramServerUrl) => {
      const networkDiagramTemplates = await getNetworkDiagramInfos(
        networkDiagramServerUrl
      );
      if (networkDiagramTemplates?.templates?.length) {
        const allTemplates = networkDiagramTemplates.templates;
        const esriTemplateNames =
          window.networkDiagramConfig?.Configurations?.esriTemplateNames || [];
        const esriT = allTemplates.filter((t) => esriTemplateNames.includes(t));
        const networkT = allTemplates.filter(
          (t) => !esriTemplateNames.includes(t)
        );
        setEsriTemplates(esriT);
        setNetworkTemplates(networkT);
      }
    };

    networkServerInfoInit(networkDiagramServerUrl);
  }, [utilityNetwork]);
  useEffect(() => {
    const allGlobalIds = currentSelectedFeatures.flatMap((layerInfo) =>
      layerInfo.features.map((feature) => feature.attributes.GLOBALID)
    );
    setGlobalIds(allGlobalIds);
  }, [currentSelectedFeatures]);
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    console.log("Selected Template:", template);
  };
  function createNetworkDiagramURL(baseURL, params) {
    const url = new URL(baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        url.searchParams.append(key, JSON.stringify(value));
      } else {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }
  const createDigramFromFeatures = async (
    networkDiagramServerUrlState,
    selectedTemplate,
    globalIds
  ) => {
    debugger;
    const url = `${networkDiagramServerUrlState}/createDiagramFromFeatures`;
    const body = {
      template: selectedTemplate,
      initialFeatures: globalIds,
      token: token
    };
    try {
      const fullURL = createNetworkDiagramURL(url, body);
      const diagram = await makeEsriRequest(fullURL);
      const digramUrl = `${networkDiagramServerUrlState}/diagrams/${diagram.diagramInfo.name}/queryDiagramContent`;
      const bodyVar = {
        token:    token  };
      const digramInfoUrl = createNetworkDiagramURL(digramUrl, bodyVar);
      const diagramContent = await makeEsriRequest(digramInfoUrl);
      console.log(
       digramInfoUrl,
        "diagramContent"
      ); 
      const diagramMapUrl = `${networkDiagramServerUrlState}/diagrams/${diagram.diagramInfo.name}/map`
    const networkDiagramObj = await makeEsriRequest(`${networkDiagramServerUrlState}/diagrams/${diagram.diagramInfo.name}`);
      console.log(networkDiagramObj,"networkDiagramObj");
      debugger
       applyLayoutAlgorithm(`${networkDiagramServerUrlState}/diagrams`,token,"SmartTreeDiagramLayout", diagram.diagramInfo.name, [], [], [], "").then(function(res){
      displayNetworkDiagramHelper(diagramMapUrl,token,view,networkDiagramObj)
        });
//      const data = buildDiagramData(diagramContent);
// console.log(data,"data");

//       if (diagramInstance.current) {
//         diagramInstance.current.model = new go.GraphLinksModel(
//           data.nodeDataArray,
//           data.linkDataArray
//         );
//       }
    } catch (error) {
      console.error("Error creating diagram", error);
      throw error;
    }
  };
  useEffect(() => {
    if (
      !networkDiagramServerUrlState ||
      !selectedTemplate ||
      !globalIds ||
      globalIds.length === 0
    ) {
      setIsGenerateReady(false);
    } else {
      setIsGenerateReady(true);
    }
  }, [networkDiagramServerUrlState, selectedTemplate, globalIds]);
  if (!isVisible) return null;
  return (
    <>
      <div className="network-diagram-widget">
        <div className="network-diagram-content">
          {esriTemplates.length || networkTemplates.length ? (
            <>
              <h3>Generate from stored templates</h3>

              {esriTemplates.length > 0 && (
                <div className="esri-templates-container">
                  <h4>Esri Templates</h4>
                  <div className="templates-buttons">
                    {esriTemplates.map((template, index) => (
                      <button
                        key={index}
                        className={`template-btn ${
                          selectedTemplate === template ? "active" : ""
                        }`}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {networkTemplates.length > 0 && (
                <div className="network-templates-container">
                  <h4>QSIT Templates</h4>
                  <div className="templates-buttons">
                    {networkTemplates.map((template, index) => (
                      <button key={index} className="template-btn">
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h3>Generate from selection</h3>
              <h4>Selected Features</h4>
              <p>{globalIds}</p>
              {!globalIds && <p>No selected features</p>}
              <button
                className="generate-diagram-btn"
                onClick={() =>
                  createDigramFromFeatures(
                    networkDiagramServerUrlState,
                    selectedTemplate,
                    globalIds
                  )
                }
                disabled={!isGenerateReady}
              >
                Generate
              </button>
            </>
          ) : (
            <p className="empty-data">No templates on this network.</p>
          )}
        </div>
      </div>
{/* <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
  <div ref={diagramRef} style={{ width: "800px", height: "600px" }} />
</div>    */}
 </>
  );
}
//  diagramdata.Containers = diagramContent.containers;

//       diagramContent.junctions.forEach((diagramJunction) => {
//             let junction = {
//               GlobalId: diagramJunction.assocGlobalID,
//               Id: diagramJunction.id,
//               ObjectId: diagramJunction.attributes["Object ID"],
//               ContainerId: diagramJunction.containerID,
//               AssetGroup: diagramJunction.attributes["Asset group"],
//               AssetType: diagramJunction.attributes["Asset type"],
//               FromId: "",
//               ToId: "",
//               Label: "",
//               geometry: diagramJunction.geometry
//             };

//             if (junction.AssetType == "Distribution Panel") {
//               junction.Label = diagramJunction.attributes["DP ID"] + " / " + diagramJunction.attributes["DP Arabic Name "];
//             }
//             else if (junction.AssetType == "Substation") {
//               if (diagramJunction.attributes["Dist SubstationID"] == null) {
//                 junction.Label = diagramJunction.attributes["DP ID"] + "/" + diagramJunction.attributes["Substation Arabic Name"];
//               }
//               else {
//                 junction.Label = diagramJunction.attributes["Dist SubstationID"] + "/" + diagramJunction.attributes["Dist Substation Name"];
//               }
//             }
//             else if (junction.AssetGroup == "MV Joint") {
//               junction.Label = junction.AssetType;
//             }
//             else if (junction.AssetType == "Mv riser" || junction.AssetType == "Disconnector") {
//               junction.Label = diagramJunction.attributes["Operating Voltage / جهد التشغيل"]
//             }
//             else {
//               junction.Label = diagramJunction.attributes["Kiosk Arabic Name "];
//             }
//             if (junction.AssetType != "DuctBank") {
//               diagramdata.Junctions.push(junction);
//             }

//           });

//           diagramContent.edges.forEach((diagramEdge) => {
//             let junction = {
//               GlobalId: diagramEdge.assocGlobalID,
//               Id: diagramEdge.id,
//               ObjectId: diagramEdge.attributes["Object ID"],
//               ContainerId: diagramEdge.containerID,
//               AssetGroup: diagramEdge.attributes["Asset group"],
//               AssetType: diagramEdge.attributes["Asset type"],
//               FromId: diagramEdge.fromID,
//               ToId: diagramEdge.toID,
//               Label: diagramEdge.attributes["Measured Length, [m]"] + " M - " + diagramEdge.attributes["Number Of Cores"] + " - " + diagramEdge.attributes["Insulation Type"],
//               geometry: diagramEdge.geometry
//             };
//             if (junction.Label.indexOf('undefined') > -1)
//               junction.Label = "Unknown";

//             diagramdata.Edges.push(junction);
//           });

//           let mainJunctions = diagramdata.Junctions.filter((p) => p.AssetType == "Distribution Panel");
//           let FromIds= [];
//           let EdgesIdexs = [];
//           for (let i = 0; i < mainJunctions.length; i++) {
//             let mainEdges = diagramdata.Edges.filter((p) => p.FromId == mainJunctions[i].Id);

//             for (let e = 0; e < mainEdges.length; e++) {
//               let elemJunction = {
//                 Id: generateGuid(),
//                 FromId: "",
//                 ToId: "",
//                 AssetGroup: "DistributionPanelOutput",
//                 AssetType: "DistributionPanelOutput",
//                 Label: "DP/Output",
//                 geometry: mainEdges[e].geometry
//               }

//               diagramdata.Junctions.push(elemJunction);

//               FromIds.push(elemJunction.Id);
//               EdgesIdexs.push(diagramdata.Edges.indexOf(mainEdges[e]));

//               let elemEdge = {
//                 Id: generateGuid(),
//                 FromId: mainJunctions[i].Id,
//                 ToId: elemJunction.Id,
//                 AssetGroup: mainEdges[i].AssetGroup,
//                 AssetType: mainEdges[i].AssetType,
//                 Label: "",
//                 geometry: mainEdges[i].geometry
//               }
//               diagramdata.Edges.push(elemEdge);
//             }
//           }
//           for (let i = 0; i < EdgesIdexs.length; i++) {
//             diagramdata.Edges[EdgesIdexs[i]].FromId = FromIds[i];
//           }
//           console.log(diagramdata,"diagramdata");
