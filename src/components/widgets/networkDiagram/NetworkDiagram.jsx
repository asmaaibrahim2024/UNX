import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./NetworkDiagram.scss";
import {
  getNetworkDiagramInfos,
  applyLayoutAlgorithm,makeRequest
} from "../networkDiagram/networkDiagramHandler";
import {
  makeEsriRequest,
  displayNetworkDiagramHelper,
} from "../../../handlers/esriHandler";

export default function NetworkDiagram({ isVisible }) {
  const token =
    "yOTqF0pRkuNeVTjHfdgHxTXj94PZ7f_1zKPKntvS0Lwl5PO2ydi-9ioRqhorcqkZ_ZyCDT-efut59VarY4jkuqYcA-7e-RrfofMxZZQ24QX1UKnCirnUqgG5F0TGhNQbvvIPLFw9t3PF7ypafbxBrSWhuLMa1auMiHu4TXj71Os-Tdtfa24xOTU_4U-CCSdl";

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const [esriTemplates, setEsriTemplates] = useState([]);
  const [networkTemplates, setNetworkTemplates] = useState([]);
  const [isGenerateReady, setIsGenerateReady] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState("SmartTreeDiagramLayout");
  const [globalIds, setGlobalIds] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [diagramServerUrl, setDiagramServerUrl] = useState(null);
    const [diagramExportUrl, setDiagramExportUrl] = useState(null);

let layoutOptions =[
  "SmartTreeDiagramLayout",
  "MainlineTreeDiagramLayout",
  "RadialTreeDiagramLayout",
  "ForceDirectedDiagramLayout",
  "CompactTreeDiagramLayout",
  "OrthogonalDiagramLayout",
  "GeoPositionsDiagramLayout",
  "HierarchicalDiagramLayout",
  "SingleCycleDiagramLayout"
]
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
console.log(esriT,customT,"Mariam");

        setEsriTemplates(esriT);
        setNetworkTemplates(customT);
      }
    };

    loadTemplates();
  }, [utilityNetwork]);

  // Extract global IDs from selected features
  useEffect(() => {
    const ids = selectedFeatures.flatMap((layerInfo) =>
      layerInfo.features.map((f) => f.attributes.GLOBALID)
    );
    setGlobalIds(ids);
  }, [selectedFeatures]);

  // Enable/disable Generate button
  useEffect(() => {
    setIsGenerateReady(
      !!diagramServerUrl && !!selectedTemplate && globalIds?.length > 0
    );
  }, [diagramServerUrl, selectedTemplate, globalIds]);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const buildUrlWithParams = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, val]) =>
      url.searchParams.append(key, Array.isArray(val) ? JSON.stringify(val) : val)
    );
    return url.toString();
  };

  const generateDiagram = async () => {
    const createUrl = `${diagramServerUrl}/createDiagramFromFeatures`;
    const createParams = {
      template: selectedTemplate,
      initialFeatures: globalIds,
      token,
    };

    try {
      const fullCreateUrl = buildUrlWithParams(createUrl, createParams);
      const diagram = await makeEsriRequest(fullCreateUrl);
      const diagramName = diagram?.diagramInfo?.name;
      if (!diagramName) throw new Error("No diagram info returned.");

      const contentUrl = `${diagramServerUrl}/diagrams/${diagramName}/queryDiagramContent`;
      const content = await makeEsriRequest(
        buildUrlWithParams(contentUrl, { token })
      );

      const mapUrl = `${diagramServerUrl}/diagrams/${diagramName}/map`;
      const diagramInfo = await makeEsriRequest(
        `${diagramServerUrl}/diagrams/${diagramName}`
      );

      await applyLayoutAlgorithm(
        `${diagramServerUrl}/diagrams`,
        token,
        selectedLayout,
        diagramName,
        [],
        [],
        [],
        ""
      );
console.log(selectedLayout,"selectedLayout");

    const exportUrl = await  displayNetworkDiagramHelper(mapUrl, token, view, diagramInfo);
    console.log(exportUrl,"exportUrl");
exportUrl&&setDiagramExportUrl(`${exportUrl}/export`)
    } catch (err) {
      console.error("Error generating network diagram:", err);
    }
  };
const exportDiagram = async()=>{
if (diagramExportUrl){
  let postJson= {
    size:"600,600",
                  token: token,
              f: "json"

  }
const response = await makeRequest({
  method: 'POST',
  url: diagramExportUrl,
  params: postJson
});

if (response?.href) {
  try {
    const fileResponse = await fetch(response.href);
    const blob = await fileResponse.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_diagram.png'; // Or derive from response.href
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up after download
  } catch (err) {
    console.error('Download failed:', err);
  }
}
}
}
  if (!isVisible) return null;

  return (
    <div className="network-diagram-widget">
      <div className="network-diagram-content">
        {esriTemplates.length || networkTemplates.length ? (
          <>
            <h3>Generate from stored templates</h3>

            {esriTemplates.length > 0 && (
              <div className="esri-templates-container">
                <h4>Esri Templates</h4>
                <div className="templates-buttons">
                  {esriTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      className={`template-btn ${
                        selectedTemplate === template ? "active" : ""
                      }`}
                      onClick={() => handleTemplateClick(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}
<div className="layout-dropdown">
  <h4>Select Layout</h4>
  <select
    value={selectedLayout}
    onChange={(e) => setSelectedLayout(e.target.value)}
  >
    {layoutOptions.map((layout) => (
      <option key={layout} value={layout}>
        {layout}
      </option>
    ))}
  </select>
</div>
            {globalIds?.length == 0&& (
              <p>No selected features</p>
            )}

            <button
              className="generate-diagram-btn"
              onClick={generateDiagram}
              disabled={!isGenerateReady}
            >
              Generate
            </button>
<button
              className="generate-diagram-btn"
              onClick={exportDiagram}
              disabled={!diagramExportUrl}
            >
              Export
            </button>
          </>
        ) : (
          <p className="empty-data">No templates on this network.</p>
        )}
      </div>
    </div>
  );
}
