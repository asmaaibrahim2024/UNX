import React, { useCallback, useEffect, useState } from "react";
import "./ShowContainment.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useI18n } from "../../../handlers/languageHandler";
import { setContainmentVisiblity } from "../../../redux/commonComponents/showContainment/showContainmentAction"

const ShowContainment = ({ feature }) => {

  const { t, i18n } = useTranslation("ShowContainment");
  const { direction } = useI18n("ShowContainment");
  const dispatch = useDispatch();

  return (
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>
          {t("Containment")}
        </span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={()=> {dispatch(setContainmentVisiblity(false))}}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">

      </div>

      <div className="feature-sidebar-footer">
      </div>
    </div>
  );
};

export default ShowContainment;
