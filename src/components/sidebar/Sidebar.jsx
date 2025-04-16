import { useState } from "react";
import TraceWidget from "../widgets/trace/TraceWidget";
import Find from "../widgets/find/Find";
import Selection from "../widgets/selection/Selection";
import { useDispatch, useSelector } from "react-redux";
import "./Sidebar.scss";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../../redux/layout/layoutAction";
import Validate from "../widgets/validate/Validate";
import ContainmentExplorer from "../widgets/containmentExplorer/ContainmentExplorer";
import ConnectionExplorer from "../widgets/connectionExplorer/ConnectionExplorer";
const Sidebar = () => {
  const { t, i18n } = useTranslation("Sidebar");
  const [activeButton, setActiveButton] = useState(null);

  const dispatch = useDispatch();
  const handleButtonClick = (buttonName) => {
    setActiveButton((prev) => (prev === buttonName ? null : buttonName));
  };
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const toggleLanguage = () => {
    const lng = language === "en" ? "ar" : "en"; // toggle logic
    i18n.changeLanguage(lng);
    dispatch(changeLanguage(lng));
  };
  return (
    <div className="sidebar">
      <button
        className="trace-button"
        onClick={() => handleButtonClick("trace")}
      >
        <span className="trace-text">{t("Trace")}</span>
      </button>
      <button
        className="trace-button"
        onClick={() => handleButtonClick("find")}
      >
        <span className="trace-text">{t("Find")}</span>
      </button>
      <button
        className="trace-button"
        onClick={() => handleButtonClick("selection")}
      >
        <span className="trace-text">{t("Selection")}</span>
      </button>
      {/* <button
        className="trace-button"
        onClick={() => handleButtonClick("Validate")}
      >
        <span className="trace-text">{t("Validate")}</span>
      </button> */}
      <button className="trace-button" onClick={toggleLanguage}>
        <span className="trace-text">{language === "en" ? "AR" : "EN"}</span>
      </button>
      <TraceWidget isVisible={activeButton === "trace"} />
      <Find isVisible={activeButton === "find"} />
      <Selection
        isVisible={activeButton === "selection"}
        setActiveButton={setActiveButton}
      />
      {/* <Validate isVisible={activeButton === "Validate"} /> */}
      {/* <ConnectionExplorer isVisible={activeButton === "ConnectionExplorer"} /> */}
    </div>
  );
};
export default Sidebar;
