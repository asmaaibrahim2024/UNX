import { useState } from "react";
import TraceWidget from "../widgets/trace/TraceWidget";
import Find from "../widgets/find/Find";
import Validate from "../widgets/validate/Validate";
import Selection from "../widgets/selection/Selection";
import NetworkDiagram from "../widgets/networkDiagram/NetworkDiagram";
import ConnectionExplorer from "../widgets/connectionExplorer/ConnectionExplorer";
import { useDispatch, useSelector } from "react-redux";
import "./Sidebar.scss";
import { changeLanguage } from "../../redux/layout/layoutAction";
import { useI18n } from "../../handlers/languageHandler";
import trace from "../../style/images/trace.svg";
import validate from "../../style/images/validate.svg";
import selection from "../../style/images/selection.svg";
import versions from "../../style/images/versions.svg";
import diagrams from "../../style/images/diagrams.svg";
import maps from "../../style/images/map-setting.svg";
import help from "../../style/images/help-circle.svg";

const Sidebar = () => {
  const { t, direction, dirClass, i18nInstance } = useI18n("Sidebar");
  const [activeButton, setActiveButton] = useState(null);

  const dispatch = useDispatch();
  const handleButtonClick = (buttonName) => {
    setActiveButton((prev) => (prev === buttonName ? null : buttonName));
  };

  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const toggleLanguage = () => {
    const lng = language === "en" ? "ar" : "en"; // toggle logic
    i18nInstance.changeLanguage(lng);
    dispatch(changeLanguage(lng));
  };

  // const utilityNetwork = useSelector((state) => state.traceReducer.utilityNetworkIntial);
  // const view = useSelector((state) => state.mapViewReducer.intialView);

  return (
    <>
      <div className="sidebar">
        <section>
          <button
            className={`trace-button ${
              activeButton === "trace" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("trace")}
          >
            <img src={trace} alt="trace" />
            <span className="trace-text">{t("Trace")}</span>
          </button>

          <button
            className={`trace-button ${
              activeButton === "validate" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("validate")}
          >
            <img src={validate} alt="validate" />
            <span className="trace-text">{t("Validate")}</span>
          </button>

          <button
            className={`trace-button ${
              activeButton === "selection" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("selection")}
          >
            <img src={selection} alt="selection" />
            <span className="trace-text">
              {t("Selection")}
              <span className="countSelect">12</span>
            </span>
          </button>

          <button
            className={`trace-button ${
              activeButton === "versions" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("versions")}
          >
            <img src={versions} alt="versions" />
            <span className="trace-text">{t("versions")}</span>
          </button>

          <button
            className={`trace-button ${
              activeButton === "diagrams" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("diagrams")}
          >
            <img src={diagrams} alt="diagrams" />
            <span className="trace-text">{t("diagrams")}</span>
          </button>
        </section>

        <section>
          <button
            className={`trace-button ${activeButton === "map" ? "active" : ""}`}
            onClick={() => handleButtonClick("map")}
          >
            <img src={maps} alt="map" />
            <span className="trace-text">{t("Map Service")}</span>
          </button>
          <button
            className={`trace-button ${
              activeButton === "help" ? "active" : ""
            }`}
            onClick={() => handleButtonClick("help")}
          >
            <img src={help} alt="map" />
            <span className="trace-text">{t("Help")}</span>
          </button>
        </section>
      </div>

      <div className="sub-sidebar">
        <TraceWidget
          isVisible={activeButton === "trace"}
          setActiveButton={setActiveButton}
        />
        {/* <Find isVisible={activeButton === "find"} /> */}
        <Validate isVisible={activeButton === "validate"} />
        <Selection isVisible={activeButton === "selection"} />
        <NetworkDiagram isVisible={activeButton === "network-diagram"} />
      </div>
    </>
  );
};
export default Sidebar;
