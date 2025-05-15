import React, { useCallback, useEffect, useState } from "react";
import "./ShowConnection.scss";
import close from "../../../style/images/x-close.svg";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import store from "../../../redux/store";
import { useI18n } from "../../../handlers/languageHandler";
import { setConnectionVisiblity } from "../../../redux/commonComponents/showConnection/showConnectionAction"

const ShowConnection = () => {
const dispatch = useDispatch();
const { t, direction, dirClass, i18nInstance } = useI18n("ShowConnection");

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  


  return (
    <div className="card card_connnection">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>{t("connection")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => dispatch(setConnectionVisiblity(false))}
        />
      </div>
      <div className="card-body">content</div>
    </div>
  );
};

export default ShowConnection;
