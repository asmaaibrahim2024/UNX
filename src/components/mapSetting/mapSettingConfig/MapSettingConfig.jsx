import { React, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./MapSettingConfig.scss";
import { useI18n } from "../../../handlers/languageHandler";
import { setActiveButton } from "../../../redux/sidebar/sidebarAction";
import { setMapSettingVisiblity } from "../../../redux/mapSetting/mapSettingAction";

import close from "../../../style/images/x-close.svg";

export default function MapSettingConfig({ isVisible }) {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");
  const dispatch = useDispatch();

  const closeMapSettingPanel = () => {
    dispatch(setActiveButton(null));
    dispatch(setMapSettingVisiblity(false));
  };

  if (!isVisible) return null;

  return (
    <div className="mapSettingConfig-container">
      <div className="mapSettingConfig-header">
        <div className="container-title">{t("Configuration")}</div>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={closeMapSettingPanel}
        />
      </div>

      <main className="mapSettingConfig-body">Configuration content</main>
    </div>
  );
}
