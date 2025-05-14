import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUtilityNetwork } from "../../../handlers/esriHandler";
import "./Validate.scss";
import chevronleft from "../../../style/images/chevron-left.svg";
import close from "../../../style/images/x-close.svg";
import folder from "../../../style/images/folder.svg";
import arrowup from "../../../style/images/cheveron-up.svg";
import arrowdown from "../../../style/images/cheveron-down.svg";
import file from "../../../style/images/document-text.svg";
import reset from "../../../style/images/refresh.svg";
import play from "../../../style/images/play.svg";
import { useI18n } from "../../../handlers/languageHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";

export default function Validate({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("Validate");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [validateResult, setValidateResult] = useState(false);

  const view = useSelector((state) => state.mapViewReducer.intialView);
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const handleValidateNetwork = async () => {
    await utilityNetwork.load();

    await utilityNetwork.validateTopology({ validateArea: view.extent });
  };
  useEffect(() => {
    if (!view || !utilityNetwork || !view.extent) return;

    const handleValidateNetwork = async () => {
      try {
        await utilityNetwork.load();
        await utilityNetwork.validateTopology({ validateArea: view.extent });
      } catch (error) {
        console.error("Error validating network topology:", error);
      }
    };

    handleValidateNetwork();
  }, [view, utilityNetwork]);

  const closeSubSidebarPanel = () => {
    dispatch(setActiveButton(null));
  };

  const startvalidation = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setValidateResult(true);
    }, 1000);
  };

  const items = [
    {
    title: "error",
    description: "Invalid Connection"
  },
  {
    title: "error",
    description: "Overheating Detected"
  },
  {
    title: "error",
    description: "Missing Ground Connection"
  },
  {
    title: "error",
    description: "Software Glitch"
  },
  {
    title: "error",
    description: "Invalid Connection"
  },
  {
    title: "error",
    description: "Overheating Detected"
  },
  {
    title: "error",
    description: "Missing Ground Connection"
  },
  {
    title: "error",
    description: "Software Glitch"
  },
  {
    title: "error",
    description: "Invalid Connection"
  },
  {
    title: "error",
    description: "Overheating Detected"
  },
  {
    title: "error",
    description: "Missing Ground Connection"
  },
  {
    title: "error",
    description: "Software Glitch"
  },
  {
    title: "error",
    description: "Invalid Connection"
  },
  {
    title: "error",
    description: "Overheating Detected"
  },
  {
    title: "error",
    description: "Missing Ground Connection"
  },
  {
    title: "error",
    description: "Software Glitch"
  },
  {
    title: "error",
    description: "Invalid Connection"
  },
  {
    title: "error",
    description: "Overheating Detected"
  },
];


  if (!isVisible) return null;

  return (
    <>
      <div className="subSidebar-widgets-container validate-container">
        <div className="subSidebar-widgets-header">
          <div className="container-title">{t("validate")}</div>
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={closeSubSidebarPanel}
          />
        </div>

        <main className="subSidebar-widgets-body">
          <div className="h-100 d-flex flex-column p_x_8 p_y_8">
            {!loading && (
              <button
                className="btn_primary flex-shrink-0"
                onClick={startvalidation}
              >
                <img src={play} alt="play" />
                <span>{t("start validation")}</span>
              </button>
            )}
            {loading && (
              <div className="validate_loading">
                <div className="apploader_container">
                  <span className="apploader"></span>
                </div>
                <p className="m_0 validate_txt">
                  <span className="m_r_4">{t("in progress")}</span>
                  <span>(</span>
                  <span>60%</span>
                  <span>)</span>
                </p>
              </div>
            )}
            {!loading && validateResult && (
              <div className="flex-fill d-flex flex-column p_t_16 overflow-auto">
                <ul className="validate_result_list flex-fill overflow-auto p_x_4">
                  {items.map((item, index) => {
                    return (
                      <li key={index}>
                        <span className="title">{item.title} {index + 1}</span>
                        <span className="description">
                        {item.description}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="m_0 totalResult flex-shrink-0">
                  <span className="m_r_4">{t("total errors")}</span>
                  <span>(</span>
                  <span>{items.length}</span>
                  <span>)</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
