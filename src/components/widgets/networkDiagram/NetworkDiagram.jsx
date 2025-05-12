import { React, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./NetworkDiagram.scss";
import { getNetworkDiagramInfos } from "../networkDiagram/networkDiagramHandler";
import { makeEsriRequest } from "../../../handlers/esriHandler";

export default function NetworkDiagram({ isVisible }) {
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
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

  // const [diagrams, setDiagrams] = useState([]);

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
    console.log(currentSelectedFeatures, "currentSelectedFeatures");
    const allGlobalIds = currentSelectedFeatures.flatMap((layerInfo) =>
      layerInfo.features.map((feature) => feature.attributes.GLOBALID)
    );

    console.log(
      allGlobalIds,
      "filteredGlobalIds"
    );
    setGlobalIds(allGlobalIds);
  }, [currentSelectedFeatures]);
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // You can do something with the selected template here
    console.log("Selected Template:", template);
  };
function createNetworkDiagramURL(baseURL, params) {
  const url = new URL(baseURL);

  // Add parameters
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      url.searchParams.append(key, JSON.stringify(value));
    } else {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}
  const createDigramFromFeatures =async (
    networkDiagramServerUrlState,
    selectedTemplate,
    globalIds
  ) => {
    debugger;
     const url = `${networkDiagramServerUrlState}/createDiagramFromFeatures`;


  const body = {
    template: selectedTemplate,
    initialFeatures: globalIds
  };
console.log(body,url,"request");


  try {
    const fullURL = createNetworkDiagramURL(url, body);
console.log(fullURL,"fullURL");
      const diagram = await makeEsriRequest(fullURL);
console.log(diagram,"fullURL");

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
    </>
  );
}
