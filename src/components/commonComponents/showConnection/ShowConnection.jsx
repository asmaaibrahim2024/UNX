import React, { useCallback, useEffect, useState } from "react";
import "./ShowConnection.scss";
import close from "../../../style/images/x-close.svg";
import extent from "../../../style/images/extent.svg";
import collapse from "../../../style/images/collapse.svg";
import reset from "../../../style/images/refresh.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";
import { setConnectionVisiblity } from "../../../redux/commonComponents/showConnection/showConnectionAction";
import { OrganizationChart } from "primereact/organizationchart";

const ShowConnection = () => {
  const dispatch = useDispatch();
  const { t, direction, dirClass, i18nInstance } = useI18n("ShowConnection");

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const [data, setData] = useState([
    {
      label: "MV Fuse",
      expanded: true,
      children: [
        {
          label: "MV Conductor",
          expanded: false,
          children: [
            {
              label: "Argentina",
            },
            {
              label: "Croatia",
            },
          ],
        },
        {
          label: "MV Busbar",
          expanded: false,
          children: [
            {
              label: "France",
            },
            {
              label: "Morocco",
            },
          ],
        },
      ],
    },
  ]);

  const nodeTemplate = (node) => {
    return (
      <div className={`p-organizationchart-node ${node.expanded ? 'expanded-node' : ''}`}>
        <span>{node.label}</span>
      </div>
    );
  };
  const handleNodeToggle = (e) => {
    const newData = [...data];
    const toggleNode = (nodes, key) => {
      for (let node of nodes) {
        if (node.key === key) {
          node.expanded = !node.expanded;
          return true;
        }
        if (node.children) {
          if (toggleNode(node.children, key)) return true;
        }
      }
      return false;
    };

    toggleNode(newData, e.node.key);
    setData(newData);
  };

  return (
    <div className="card card_connnection">
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
        <span>{t("connection")}</span>
        <div>
          <img
            src={extent}
            alt="extent"
            className="cursor-pointer m_r_8"
            height="16"
          />
          <img
            src={close}
            alt="close"
            className="cursor-pointer"
            onClick={() => dispatch(setConnectionVisiblity(false))}
          />
        </div>
      </div>
      <div className="card-body p_16 overflow-auto">
        <div className="d-flex flex-column h-100">
          <div className="flex-shrink-0 d-flex justify-content-end m_b_24">
            {/* <button className="btn_secondary flex-shrink-0 m_r_8">
              <img src={reset} alt="reset" height="16" />
              <span>{t("reset")}</span>
            </button> */}
            <button className="btn_primary flex-shrink-0">
              <img src={collapse} alt="collapse" height="16" />
              <span>{t("Collapse all")}</span>
            </button>
          </div>
          <div className="flex-fill overflow-auto">
            <div className="tree_diagram primereact-container">
              <OrganizationChart value={data} nodeTemplate={nodeTemplate} onNodeToggle={handleNodeToggle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowConnection;