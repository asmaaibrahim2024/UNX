import React, { useCallback, useEffect, useState } from "react";
import "./ShowContainment.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../handlers/languageHandler";
import { setContainmentVisiblity } from "../../../redux/commonComponents/showContainment/showContainmentAction";
import file from "../../../style/images/document-text.svg";
import dot from "../../../style/images/dots-vertical.svg";

const ShowContainment = ({ feature }) => {
  const { t, i18n } = useTranslation("ShowContainment");
  const { direction } = useI18n("ShowContainment");
  const dispatch = useDispatch();
  const items = [
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
    "item",
  ];

  return (
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{t("Containment")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setContainmentVisiblity(false));
          }}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        <div className="feature-sidebar-body-container d-flex flex-column h-100">
          <h2 className="title m_0 flex-shrink-0">
            <span>{t("Fuse")}</span>
            <span className="fw-bold m_l_8">#33255</span>
          </h2>
          <div className="flex-fill overflow-auto">
            <ul className="elements-list-global m_x_2 h-100">
              {items.map((item, index) => {
                return (
                  <li className="element-item" key={index}>
                    <div className="object-header">
                      <span>#0{index + 1}</span>
                      <span className="m_x_4 item_name">{item}</span>
                    </div>
                    <div className="header-action">
                      <img
                        src={file}
                        alt="properties"
                        className="cursor-pointer"
                      />
                      <img src={dot} alt="menu" className="cursor-pointer" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="feature-sidebar-footer"></div>
    </div>
  );
};

export default ShowContainment;
