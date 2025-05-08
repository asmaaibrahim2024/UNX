import React from "react";
import "./ShowProperties.scss";
import close from "../../../style/images/x-close.svg";
import select from "../../../style/images/select.svg";
import flag from "../../../style/images/flag.svg";
import barrier from "../../../style/images/barrier.svg";

const ShowProperties = ({ feature, direction, t, isLoading, onClose }) => {
  const attributes = feature?.attributes || {};

  return (
    <div className={`feature-sidebar feature-sidebar-prop ${direction}`}>
      <div className="feature-sidebar-header propertites flex-shrink-0 bg-transparent fw-normal">
        <span>{isLoading ? t("Loading...") : t("Feature Details")}</span>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={onClose}
        />
      </div>

      <div className="feature-sidebar-body flex-fill overflow-auto">
        {isLoading || !feature ? (
          <></>
        ) : (
          <table>
            {/* <thead>
              <tr>
                <th
                  style={{
                    textAlign: direction === "rtl" ? "right" : "left",
                  }}
                >
                  <strong>{t("Property")}</strong>
                </th>
                <th
                  style={{
                    textAlign: direction === "rtl" ? "right" : "left",
                  }}
                >
                  <strong>{t("Value")}</strong>
                </th>
              </tr>
            </thead> */}
            <tbody>
              {Object.entries(attributes).map(([field, value], idx) => (
                <tr
                  key={field}
                  className="bg-transparent"
                  // style={{
                  //   backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                  // }}
                >
                  <td className="key">{field}</td>
                  <td className="val">{value !== "" ? value : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="feature-sidebar-footer">
        <div
          className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
        >
          <img src={select} alt="close" />
          <span>{t("Add to selection")}</span>
        </div>
        <div
          className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
        >
          <img src={flag} alt="close" />
          <span>{t("As a start point")}</span>
        </div>
        <div
          className="feature_btn cursor-pointer d-flex flex-column justify-content-center align-items-center"
        >
          <img src={barrier} alt="close" />
          <span>{t("As a barrier point")}</span>
        </div>
      </div>
    </div>
  );
};

export default ShowProperties;
