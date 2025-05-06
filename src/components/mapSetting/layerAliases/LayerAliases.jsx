import { React, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./LayerAliases.scss";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";

export default function LayerAliases() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [value, setValue] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const cities = [
    { name: "New York", code: "NY" },
    { name: "Rome", code: "RM" },
    { name: "London", code: "LDN" },
    { name: "Istanbul", code: "IST" },
    { name: "Paris", code: "PRS" },
  ];

  const items = ["Item 1", "Item 2", "Item 3", "1", "5", "555", "55555555555"];

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body">
        <div>
          <div className="d-flex flex-column m_b_16">
            <label className="m_b_8">{t("Layer Name")}</label>
            <Dropdown
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.value)}
              options={cities}
              optionLabel="name"
              placeholder={t("Select Layer Name")}
              className="w-full md:w-14rem"
              filter
            />
          </div>
          {items.map((item, index) => (
            <div className="row g-4" key={index}>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {t("Field Name")} {index + 1}
                  </label>
                </div>
              </div>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {t("Alias English Name")}
                  </label>
                  <InputText
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>
              <div className="col-4">
                <div className="d-flex flex-column m_b_16">
                  <label className="m_b_8">
                    {t("Alias Arabic Name")}
                  </label>
                  <InputText
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>
            </div>
          ))}
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
