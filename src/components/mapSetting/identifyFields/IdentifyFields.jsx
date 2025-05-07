import { React, useState, useEffect } from "react";
import "./IdentifyFields.scss";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useI18n } from "../../../handlers/languageHandler";
import reset from "../../../style/images/refresh.svg";
import close from "../../../style/images/x-close.svg";
import trash from "../../../style/images/trash-03.svg";

export default function IdentifyFields() {
  const { t, direction, dirClass, i18nInstance } = useI18n("MapSetting");

  const [selectedCity, setSelectedCity] = useState(null);
  const cities = [
    { name: "Layer 01", code: "NY" },
    { name: "Layer 02", code: "RM" },
    { name: "Layer 03", code: "LDN" },
    { name: "Layer 04", code: "IST" },
    { name: "Layer 05", code: "PRS" },
  ];

  // Sample data
  const [products, setProducts] = useState([
    {
      id: 1,
      layerName: "Layer Name A",
      status: "INSTOCK",
      selectedFields: "selected Fields",
    },
    {
      id: 2,
      layerName: "Layer Name B",
      status: "OUTOFSTOCK",
      selectedFields: "selected Fields",
    },
  ]);

  // Dropdown options
  const statusOptions = [
    { label: "In Stock", value: "INSTOCK" },
    { label: "Out of Stock", value: "OUTOFSTOCK" },
    { label: "Low Stock", value: "LOWSTOCK" },
  ];

  const statusBodyTemplate = (rowData) => {
    return (
      // <Dropdown
      //   value={rowData.status}
      //   options={statusOptions}
      //   optionLabel="label"
      //   optionValue="value"
      //   onChange={(e) => {
      //     const updatedProducts = [...products];
      //     const rowIndex = updatedProducts.findIndex(
      //       (item) => item.id === rowData.id
      //     );
      //     updatedProducts[rowIndex].status = e.value;
      //     setProducts(updatedProducts);
      //   }}
      //   placeholder="Select Status"
      //   className="w-100"
      //   appendTo="self"
      // />
      <MultiSelect
        value={selectedCity}
        options={cities}
        optionLabel="name"
        placeholder="Select Field"
        maxSelectedLabels={3}
        className="w-100"
        pt={{
          panel: { className: "mapSetting-layer-panel" },
        }}
      />
    );
  };

  const selectedFieldsBodyTemplate = (rowData) => {
    const items = ["item 01", "item 02hhhhhh", "item 03", "item 04", "item 01"];
    return (
      <div>
        <ul className="list-unstyled selected_fields_list">
          {items.map((item, index) => {
            return (
              <li>
                <div className="d-flex align-items-center">
                  <span>{item}</span>
                  <img
                    src={close}
                    alt="close"
                    className="cursor-pointer m_l_8"
                    height="14"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const deleteBodyTemplate = (rowData) => {
    return (
      <img src={trash} alt="trash" className="cursor-pointer" height="14" />
    );
  };

  return (
    <div className="card border-0 rounded_0 h-100 p_x_32 p_t_16">
      <div className="card-body d-flex flex-column">

        <div className="dataGrid w-100 flex-fill overflow-auto">
          <DataTable
            value={products}
            tableStyle={{ minWidth: "50rem" }}
            scrollable
            scrollHeight="flex"
            stripedRows
            size="small"
          >
            <Column
              style={{ width: 200 }}
              field="layerName"
              header="Layer Name"
            ></Column>
            <Column
              style={{ width: 200 }}
              header="Fields"
              body={statusBodyTemplate}
            ></Column>
            <Column
              field="selectedFields"
              header="Selected Fields"
              body={selectedFieldsBodyTemplate}
            ></Column>
            {/* <Column
              style={{ width: 40 }}
              field="selectedFields"
              header=""
              body={deleteBodyTemplate}
            ></Column> */}
          </DataTable>
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
