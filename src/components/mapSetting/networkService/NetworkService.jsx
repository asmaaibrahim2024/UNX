import { React, useState } from "react";
import { InputText } from "primereact/inputtext";
import "./NetworkService.scss";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";

export default function NetworkService() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [value, setValue] = useState('');

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_y_16">
      <div className="card-body">
        <div className="d-flex flex-column m_b_16">
          <label className="m_b_8">{t("Utility Network Service")}</label>
          <InputText value={value} onChange={(e) => setValue(e.target.value)}
          className="p-inputtext-sm" />
        </div>
        <div className="d-flex flex-column m_b_16">
          <label className="m_b_8">{t("Diagram Service URL")}</label>
          <InputText value={value} onChange={(e) => setValue(e.target.value)}
          className="p-inputtext-sm" />
        </div>
        <div className="d-flex flex-column m_b_16">
          <label className="m_b_8">{t("Feature Service URL")}</label>
          <InputText value={value} onChange={(e) => setValue(e.target.value)}
          className="p-inputtext-sm" />
        </div>
        <div className="d-flex flex-column m_b_16">
          <label className="m_b_8">{t("Default basemap")}</label>
          <InputText value={value} onChange={(e) => setValue(e.target.value)}
          className="p-inputtext-sm" />
        </div>
      </div>
      <div className="card-footer bg-transparent border-0">
        <div className="action-btns pb-2">
          <button className="reset">
            <img src={reset} alt="reset" />
            {t("Reset")}
          </button>
          <button className="trace">{t("Connect")}</button>
        </div>
      </div>
    </div>
  );
}
