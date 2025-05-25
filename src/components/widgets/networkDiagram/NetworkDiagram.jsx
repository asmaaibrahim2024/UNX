import React, { useEffect, useState,useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputSwitch } from "primereact/inputswitch";
import "./NetworkDiagram.scss";
import { useI18n } from "../../../handlers/languageHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { setNetworkDiagramSplitterVisiblity,setExportDiagramUrl,setDiagramModelData } from "../../../redux/widgets/networkDiagram/networkDiagramAction";
import close from "../../../style/images/x-close.svg";
import diagramIcon from "../../../style/images/diagram.svg";
import esri from "../../../style/images/esri.svg";
import qsit from "../../../style/images/qsit.svg";
import * as go from "gojs";
import { getNetworkDiagramInfos } from "../networkDiagram/networkDiagramHandler";
import { makeEsriRequest } from "../../../handlers/esriHandler";
export default function NetworkDiagram({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("NetworkDiagram");
  const dispatch = useDispatch();
  const $ = go.GraphObject.make;
  const diagramRef = useRef(null);
  const diagramInstance = useRef(null);
  const isNetworkDiagramSplitterVisible = useSelector(
    (state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible
  );
  const diagramModelData = useSelector(
    (state) => state.networkDiagramReducer.diagramModelData
  );
  const token =
    "yOTqF0pRkuNeVTjHfdgHxTXj94PZ7f_1zKPKntvS0Lwl5PO2ydi-9ioRqhorcqkZ_ZyCDT-efut59VarY4jkugy_YGulwtNwQjP9Mm-ZxwhpXBO5al-CnGd1sHd31BCVL1MTpKpnwo05IGnhWWwgFJ9uytr1s58ucWuNpp3jWXwPD7R2pwY_Z6Qbq3yNFX9u"
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const groupedTraceResultGlobalIds = useSelector(
    (state) => state.traceReducer.groupedTraceResultGlobalIds
  );

  const [esriTemplates, setEsriTemplates] = useState([]);
  const [templateSwitchStates, setTemplateSwitchStates] = useState({});
  const [isGenerateReady, setIsGenerateReady] = useState(false);
  const [globalIds, setGlobalIds] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [diagramServerUrl, setDiagramServerUrl] = useState(null);

//!diagram intiation
  useEffect(() => {
    if (!diagramRef.current || diagramInstance.current) return;

    const diagram = $(go.Diagram, diagramRef.current, {
      initialAutoScale: go.Diagram.UniformToFill,
      layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 20
      }),
      "undoManager.isEnabled": true
    });

    diagram.nodeTemplateMap.add("container",
      $(go.Node, "Auto",
        { locationSpot: go.Spot.Center },
        $(go.Shape, "Rectangle", {
          fill: "#e0f7fa", stroke: "#006064", strokeWidth: 2, width: 100, height: 40
        }),
        $(go.TextBlock, {
          margin: 8, font: "bold 12px sans-serif", wrap: go.TextBlock.WrapFit, textAlign: "center"
        },
          new go.Binding("text", "label"))
      )
    );

    diagram.nodeTemplateMap.add("junction",
      $(go.Node, "Auto",
        $(go.Shape, "Ellipse", {
          fill: "#f3e5f5", stroke: "#6a1b9a", strokeWidth: 2, width: 40, height: 40
        }),
        $(go.TextBlock, {
          margin: 4, font: "10px sans-serif", textAlign: "center"
        },
          new go.Binding("text", "label"))
      )
    );

    diagram.nodeTemplate =
      $(go.Node, "Auto",
        $(go.Shape, "RoundedRectangle", {
          fill: "#c8e6c9", stroke: "#2e7d32", strokeWidth: 2
        }),
        $(go.TextBlock, {
          margin: 8, font: "bold 11px sans-serif", wrap: go.TextBlock.WrapFit
        },
          new go.Binding("text", "label"))
      );

    diagram.linkTemplate =
      $(go.Link,
        { routing: go.Link.Orthogonal, corner: 10 },
        $(go.Shape, { strokeWidth: 2, stroke: "#555" }),
        $(go.Shape, { toArrow: "Standard", stroke: "#555", fill: "#555" }),
        $(go.TextBlock, {
          segmentOffset: new go.Point(0, -10),
          font: "10px sans-serif", stroke: "#333"
        },
          new go.Binding("text", "text"))
      );

    diagramInstance.current = diagram;
  }, []);

 //!prepare diagram data 
  function buildDiagramData(diagramContent) {
    const nodes = [];
    const links = [];

    diagramContent.junctions.forEach((j) => {
      nodes.push({
        key: j.id,
        label: j.id || `Junction ${j.id}`,
        category: "junction"
      });
    });

    diagramContent.containers.forEach((c) => {
      nodes.push({
        key: c.assocSourceID,
        label: c.assocSourceID || `Container ${c.id}`,
        category: "container"
      });
    });

    diagramContent.edges.forEach((e) => {
      links.push({
        from: e.fromID,
        to: e.toID
      });
    });

    return { nodeDataArray: nodes, linkDataArray: links };
  }
  //!Load templates
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
        console.log(esriT, customT, "Mariam");

        setEsriTemplates(esriT);
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
//!create nd url
  function createNetworkDiagramURL(baseURL, params) {
    const url = new URL(baseURL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    return url.toString();
  }
  //!create diagram
  const createDiagramFromFeatures = async () => {
    debugger
    if (selectedTemplate&& globalIds.length>0) {

      try {
        const createUrl = `${diagramServerUrl}/createDiagramFromFeatures`;
        const queryUrlBase = `${diagramServerUrl}/diagrams`;
  
        const diagramRes = await makeEsriRequest(
          createNetworkDiagramURL(createUrl, {
            template: selectedTemplate,
            initialFeatures: globalIds,
            token,
          })
        );
  
        const contentRes = await makeEsriRequest(
          createNetworkDiagramURL(
            `${queryUrlBase}/${diagramRes.diagramInfo.name}/queryDiagramContent`,
            { token }
          )
        );
  
    const data = buildDiagramData(contentRes);

          const model = new go.GraphLinksModel(data.nodeDataArray, data.linkDataArray);
          diagramInstance.current = model;
          // Save diagram to Redux
          dispatch(setDiagramModelData(model.toJson()));


      } catch (error) {
        console.error("Error creating diagram", error);
      }
    }
  };

//!handle switching templates
  const handleSwitchChange = (selected) => {
    const updatedStates = {};
    esriTemplates.forEach((template) => {
      updatedStates[template] = template === selected;
    });
    setTemplateSwitchStates(updatedStates);
    setSelectedTemplate(selected);
  };
  //!Extract global IDs from selected features
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

  //!Enable/disable Generate button
  useEffect(() => {
    console.log(diagramServerUrl,selectedTemplate,globalIds,"Maaaaaaaaaaaar");
    
    setIsGenerateReady(
      !!diagramServerUrl && !!selectedTemplate && globalIds?.length > 0
    );
  }, [diagramServerUrl, selectedTemplate, globalIds]);
const generateDiagram = async () => {
       dispatch(setNetworkDiagramSplitterVisiblity(true))
    await  createDiagramFromFeatures()

};
const closeSubSidebarPanel = () => {
    dispatch(setActiveButton(null));
    dispatch(setNetworkDiagramSplitterVisiblity(false));
  };

  if (!isVisible) return null;

  return (
  
    <div className="subSidebar-widgets-container diagram-container">
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
            (selectedTemplate) && "selected"
          }`}
        >
          <h2 className="block_heading">
            <img src={esri} alt="esri" height="16" />
            <span className="m_l_8">{t("esri templates")}</span>
          </h2>
          <div className="block_options">
            {esriTemplates.map((templateName) => (
              <div
                className="form_group form_group_switch m_b_16"
                key={templateName}
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
            ))}
          </div>
        </div>
      </main>
      <div className="subSidebar-widgets-footer p_x_16">
        <h2 className="diagram-footer-title">{t("Generate from Selection")}</h2>
        <h3 className="diagram-footer-result">
          <span className="m_r_4">{globalIds.length}</span>
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
