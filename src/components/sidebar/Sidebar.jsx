import { useEffect, useState } from "react";
import TraceWidget from "../widgets/trace/TraceWidget";
import Find from "../widgets/find/Find";
import Validate from "../widgets/validate/Validate";
import Selection from "../widgets/selection/Selection";
import NetworkDiagram from "../widgets/networkDiagram/NetworkDiagram";
import ConnectionExplorer from "../widgets/connectionExplorer/ConnectionExplorer";
import { useDispatch, useSelector } from "react-redux";
import "./Sidebar.scss";
import { changeLanguage } from "../../redux/layout/layoutAction";
import { setMapSettingVisiblity } from "../../redux/mapSetting/mapSettingAction";
import { useI18n } from "../../handlers/languageHandler";
import trace from "../../style/images/trace.svg";
import validate from "../../style/images/validate.svg";
import selection from "../../style/images/selection.svg";
import versions from "../../style/images/versions.svg";
import diagrams from "../../style/images/diagrams.svg";
import maps from "../../style/images/map-setting.svg";
import help from "../../style/images/help-circle.svg";

import { setActiveButton } from "../../redux/sidebar/sidebarAction";
import {
  closeFindPanel,
  getSelectedFeaturesCount,
} from "../../handlers/esriHandler";
import Search from "antd/es/transfer/search";

import MapSettingConfig from "../mapSetting/mapSettingConfig/MapSettingConfig";
import {
  setDisplaySearchResults,
  setShowSidebar,
} from "../../redux/widgets/find/findAction";

const Sidebar = () => {
  const { t, direction, dirClass, i18nInstance } = useI18n("Sidebar");
  // const [activeButton, setActiveButton] = useState(null);
  const activeButton = useSelector(
    (state) => state.sidebarReducer.activeButton
  );
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const dispatch = useDispatch();

  const handleButtonClick = (buttonName) => {
    //close the search panel when clicked on any button
    closeFindPanel(dispatch, setShowSidebar, setDisplaySearchResults);

    // setActiveButton((prev) => (prev === buttonName ? null : buttonName));

    const newActiveButton = activeButton === buttonName ? null : buttonName;
    dispatch(setActiveButton(newActiveButton));

    dispatch(setMapSettingVisiblity(false));
  };

  const mapSettingClick = (buttonName) => {
    const mapSettingVisiblity = activeButton === buttonName ? false : true;
    dispatch(setMapSettingVisiblity(mapSettingVisiblity));
  };

  const showSearchResults = useSelector(
    (state) => state.findReducer.displaySearchResults
  );

  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const toggleLanguage = () => {
    const lng = language === "en" ? "ar" : "en"; // toggle logic
    i18nInstance.changeLanguage(lng);
    dispatch(changeLanguage(lng));
  };

  useEffect(() => {
    console.log("activeButton:", activeButton);
  }, [activeButton]);

  useEffect(() => {
    if (showSearchResults && activeButton !== "searchResult") {
      setActiveButton(null); // reset active button
    }
    console.log("showSearchResults:", showSearchResults);
  }, [showSearchResults]);
  // const utilityNetwork = useSelector((state) => state.mapViewReducer.utilityNetworkIntial);
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
              <span className="countSelect">
                {getSelectedFeaturesCount(selectedFeatures)}
              </span>
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
            onClick={() => {
              handleButtonClick("map");
              mapSettingClick("map");
            }}
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
            <img src={help} alt="help" />
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
        <MapSettingConfig isVisible={activeButton === "map"} />
      </div>
    </>
  );
};
export default Sidebar;
