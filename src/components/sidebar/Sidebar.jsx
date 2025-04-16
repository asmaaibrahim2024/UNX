import { useState } from "react";
import TraceWidget from "../widgets/trace/TraceWidget";
import Find from "../widgets/find/Find";
import Selection from "../widgets/selection/Selection";
import { useDispatch, useSelector } from "react-redux";
import "./Sidebar.scss";
import { changeLanguage } from "../../redux/layout/layoutAction";
import { useI18n } from "../../handlers/languageHandler";
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
