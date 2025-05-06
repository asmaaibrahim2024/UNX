import React from "react";
import "./ShowProperties.scss";

const ShowProperties = ({ feature, direction, t, isLoading, onClose }) => {
  const attributes = feature?.attributes || {};

  return (
    <div className={`feature-sidebar ${direction}`}>
      <div className="feature-sidebar-header">
        <span>
          {isLoading ? t("Loading...") : t("Feature Details")}
        </span>
        <button onClick={onClose}>×</button>
      </div>

      <div className="feature-sidebar-body">
        {isLoading || !feature ? (
          <></>
        ) : (
          <table>
            <thead>
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
            </thead>
            <tbody>
              {Object.entries(attributes).map(([field, value], idx) => (
                <tr
                  key={field}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td>{field}</td>
                  <td>{value !== "" ? value : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShowProperties;