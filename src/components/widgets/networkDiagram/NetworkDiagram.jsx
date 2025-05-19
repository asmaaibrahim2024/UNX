import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputSwitch } from 'primereact/inputswitch';
import "./NetworkDiagram.scss";
import { useI18n } from "../../../handlers/languageHandler";
import {
  getNetworkDiagramInfos,
  applyLayoutAlgorithm,
  makeRequest,
} from "../networkDiagram/networkDiagramHandler";
import {
  makeEsriRequest,
  displayNetworkDiagramHelper,
} from "../../../handlers/esriHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { setNetworkDiagramSplitterVisiblity } from "../../../redux/widgets/networkDiagram/networkDiagramAction";
import close from "../../../style/images/x-close.svg";
import diagramIcon from "../../../style/images/diagram.svg";
import esri from "../../../style/images/esri.svg";
import qsit from "../../../style/images/qsit.svg";

export default function NetworkDiagram({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("NetworkDiagram");
  const dispatch = useDispatch();

  const [checkedBasic, setCheckedBasic] = useState(true);
  const [checkedCollapsed, setCheckedCollapsed] = useState(false);
  const [checkedExpanded, setCheckedExpanded] = useState(false);
  const [checkedSLD, setCheckedSLD] = useState(false);

  const isNetworkDiagramSplitterVisible = useSelector((state) => state.networkDiagramReducer.isNetworkDiagramSplitterVisible);
  

  const token =
    "yOTqF0pRkuNeVTjHfdgHxTXj94PZ7f_1zKPKntvS0Lwl5PO2ydi-9ioRqhorcqkZ_ZyCDT-efut59VarY4jkuqYcA-7e-RrfofMxZZQ24QX1UKnCirnUqgG5F0TGhNQbvvIPLFw9t3PF7ypafbxBrSWhuLMa1auMiHu4TXj71Os-Tdtfa24xOTU_4U-CCSdl";

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const view = useSelector((state) => state.mapViewReducer.intialView);
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  const groupedTraceResultGlobalIds = useSelector(
    (state) => state.traceReducer.groupedTraceResultGlobalIds
  );

  const [esriTemplates, setEsriTemplates] = useState([]);
  const [networkTemplates, setNetworkTemplates] = useState([]);
  const [isGenerateReady, setIsGenerateReady] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(
    "SmartTreeDiagramLayout"
  );
  const [globalIds, setGlobalIds] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [diagramServerUrl, setDiagramServerUrl] = useState(null);
  const [diagramExportUrl, setDiagramExportUrl] = useState(null);

  let layoutOptions = [
    "SmartTreeDiagramLayout",
    "MainlineTreeDiagramLayout",
    "RadialTreeDiagramLayout",
    "ForceDirectedDiagramLayout",
    "CompactTreeDiagramLayout",
    "OrthogonalDiagramLayout",
    "GeoPositionsDiagramLayout",
    "HierarchicalDiagramLayout",
    "SingleCycleDiagramLayout",
  ];
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
        console.log(esriT, customT, "Mariam");

        setEsriTemplates(esriT);
        setNetworkTemplates(customT);
      }
    };

    loadTemplates();
  }, [utilityNetwork]);

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
      url.searchParams.append(
        key,
        Array.isArray(val) ? JSON.stringify(val) : val
      )
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
      const exportUrl = await displayNetworkDiagramHelper(
        mapUrl,
        token,
        view,
        diagramInfo
      );
      console.log(exportUrl, "exportUrl");
      exportUrl &&
        setDiagramExportUrl(
          `${exportUrl}/export?f=image&size=800,600&token=${token}`
        );
    } catch (err) {
      console.error("Error generating network diagram:", err);
    }
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
  };

  const resetAllCheck = () => {
    setCheckedBasic(false);
    setCheckedCollapsed(false);
    setCheckedExpanded(false);
    setCheckedSLD(false);
  }
  
  const setCheckedBasicFunction = (e) => {
    if (e) resetAllCheck();
    setCheckedBasic(e);
  }

  const setCheckedCollapsedFunction = (e) => {
    if (e) resetAllCheck();
    setCheckedCollapsed(e);
  }

  const setCheckedExpandedFunction = (e) => {
    if (e) resetAllCheck();
    setCheckedExpanded(e);
  }

  const setCheckedSLDFunction = (e) => {
    if (e) resetAllCheck();
    setCheckedSLD(e);
  }
  if (!isVisible) return null;

  return (
    // <div className="network-diagram-widget">
    //   <div className="network-diagram-content">
    //     {esriTemplates.length || networkTemplates.length ? (
    //       <>
    //         <h3>Generate from stored templates</h3>

    //         {esriTemplates.length > 0 && (
    //           <div className="esri-templates-container">
    //             <h4>Esri Templates</h4>
    //             <div className="templates-buttons">
    //               {esriTemplates.map((template, idx) => (
    //                 <button
    //                   key={idx}
    //                   className={`template-btn ${
    //                     selectedTemplate === template ? "active" : ""
    //                   }`}
    //                   onClick={() => handleTemplateClick(template)}
    //                 >
    //                   {template}
    //                 </button>
    //               ))}
    //             </div>
    //           </div>
    //         )}
    //         <div className="layout-dropdown">
    //           <h4>Select Layout</h4>
    //           <select
    //             value={selectedLayout}
    //             onChange={(e) => setSelectedLayout(e.target.value)}
    //           >
    //             {layoutOptions.map((layout) => (
    //               <option key={layout} value={layout}>
    //                 {layout}
    //               </option>
    //             ))}
    //           </select>
    //         </div>
    //         {globalIds?.length == 0 && <p>No selected features</p>}

    //         <button
    //           className="generate-diagram-btn"
    //           onClick={generateDiagram}
    //           disabled={!isGenerateReady}
    //         >
    //           Generate
    //         </button>
    //         <button
    //           className="generate-diagram-btn"
    //           onClick={exportDiagram}
    //           disabled={!diagramExportUrl}
    //         >
    //           Export
    //         </button>
    //       </>
    //     ) : (
    //       <p className="empty-data">No templates on this network.</p>
    //     )}
    //   </div>
    //   {diagramExportUrl && (
    //     <div className="diagram-preview">
    //       <h4>Diagram Preview</h4>
    //       <img
    //         src={diagramExportUrl}
    //         alt="Network Diagram"
    //         style={{ width: "100%", maxHeight: "600px", objectFit: "contain" }}
    //       />
    //     </div>
    //   )}
    // </div>
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
        <div className={`diagram_selection_block m_b_16 ${(checkedBasic || checkedCollapsed || checkedExpanded) && 'selected'}`}>
          <h2 className="block_heading">
            <img src={esri} alt="esri" height="16" />
            <span className="m_l_8">{t("esri templates")}</span>
          </h2>
          <div className="block_options">
            <div className="form_group form_group_switch m_b_16">
              <InputSwitch checked={checkedBasic} onChange={(e) => setCheckedBasicFunction(e.value)} id="flexCheckDefault"/>
              <label className="lbl" htmlFor="flexCheckDefault">{t("Basic")}</label>
            </div>
            <div className="form_group form_group_switch m_b_16">
              <InputSwitch checked={checkedCollapsed} onChange={(e) => setCheckedCollapsedFunction(e.value)} />
              <label className="lbl">{t("Collapsed Container")}</label>
            </div>
            <div className="form_group form_group_switch">
              <InputSwitch checked={checkedExpanded} onChange={(e) => setCheckedExpandedFunction(e.value)} />
              <label className="lbl">{t("Expanded Container")}</label>
            </div>
          </div>
        </div>
        <div className={`diagram_selection_block ${checkedSLD  && 'selected'}`}>
          <h2 className="block_heading">
            <img src={qsit} alt="qsit" height="16" />
            <span className="m_l_8">{t("qsit templates")}</span>
          </h2>
          <div className="block_options">
            <div className="form_group form_group_switch">
              <InputSwitch checked={checkedSLD} onChange={(e) => {setCheckedSLDFunction(e.value)}} />
              <label className="lbl">{t("SLD")}</label>
            </div>
          </div>
        </div>
      </main>
      <div className="subSidebar-widgets-footer p_x_16">
        <h2 className="diagram-footer-title">{t("Generate from Selection")}</h2>
        <h3 className="diagram-footer-result">
          <span className="m_r_4">343</span>
          <span>{t("features has been selected")}</span>
        </h3>
        <button className="btn_primary w-100 rounded_8"
        onClick={() => dispatch(setNetworkDiagramSplitterVisiblity(true))}>
          <img src={diagramIcon} alt="diagram" height="16" />
          {t("generate")}
        </button>
      </div>
    </div>
  );
}
