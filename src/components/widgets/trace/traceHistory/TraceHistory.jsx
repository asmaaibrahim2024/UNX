import { React, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTraceHistory } from "../traceHandler";
import "./TraceHistory.scss";
import { useI18n } from "../../../../handlers/languageHandler";
import edit from "../../../../style/images/edit-pen.svg";
import trash from "../../../../style/images/trash-03.svg";
import close from "../../../../style/images/x-close.svg";
import chevronleft from "../../../../style/images/chevron-left.svg";
import arrowup from "../../../../style/images/cheveron-up.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import search from "../../../../style/images/search.svg";

import { Accordion, AccordionTab } from "primereact/accordion";
import { Calendar } from "primereact/calendar";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
// import { InputText } from 'primereact/inputtext';

export default function TraceHistory({ setActiveTab, setActiveButton }) {
  const { t, direction } = useI18n("Trace");
  const dispatch = useDispatch();
  const [activeIndex, setActiveIndex] = useState([0]); // Initialize with first tab open, adjust as needed
  const [datetime12h, setDateTime12h] = useState(null);

  // Sample data for the accordion tabs
  const items = [
    { name: "Today", content: ["09:00,00"] },
    { name: "Yesterday", content: ["08:09:00", "10:10:02", "09:00,00"] },
    { name: "Tuesday", content: ["09:00,00"] },
    { name: "Monday", content: ["09:09:00", "10:10:02"] },
    {
      name: "Sunday",
      content: ["08:09:00", "10:10:02", "09:00,00", "07:00:05"],
    },
    { name: "Two weeks ago", content: ["09:09:00", "10:10:02"] },
    { name: "Last Month", content: ["09:09:00", "10:10:02"] },
    { name: "Older", content: ["09:09:00"] },
  ];


  useEffect(() => {
    console.log("Trace History component");

    //  async function getTraceHistory() {
    //  const traceHistory = await fetchTraceHistory();
    //  }

    //  getTraceHistory();
  }, []);

  return (
    <div className="subSidebar-widgets-container trace-history">
      <div className="subSidebar-widgets-header trace-header">
        <div className="d-flex align-items-center">
          <img
            src={chevronleft}
            alt="close"
            className="cursor-pointer"
            onClick={() => setActiveTab("input")}
          />
          <div className="container-title">{t("Trace History")}</div>
        </div>
        <img
          src={close}
          alt="close"
          className="cursor-pointer"
          onClick={() => dispatch(setActiveButton(""))}
        />
      </div>
      <div className="subSidebar-widgets-body trace-body">
        <div className="h-100 position-relative p-2 d-flex flex-column">
          {/*search by date time*/}
          <div className="flex-shrink-0 mb-2">
            <IconField iconPosition="left" className="p-icon-field-custom">
              <InputIcon>
                <img src={search} alt="search" />
              </InputIcon>
              <Calendar
                placeholder={t("search")}
                value={datetime12h}
                onChange={(e) => setDateTime12h(e.value)}
                showTime
                hourFormat="12"
                showButtonBar
                style={{ width: "100%" }}
                inputStyle={{ width: "100%" }}
                selectionMode="single" // Ensures popup closes on date selection
              />
            </IconField>
          </div>
          {/*history list*/}
          {items.length > 0 ? (
            <Accordion
              multiple
              activeIndex={activeIndex}
              onTabChange={(e) => setActiveIndex(e.index)}
              className="accordion-custom flex-fill overflow-auto p_x_4"
            >
              {items.map((item, index) => (
                <AccordionTab
                  key={index}
                  header={
                    <span className="flex align-items-center gap-2 w-full d-flex justify-content-between">
                      <span className="font-bold white-space-nowrap">
                        {item.name}
                      </span>
                      <img
                        src={activeIndex.includes(index) ? arrowup : arrowdown}
                        alt={
                          activeIndex.includes(index) ? "collapse" : "expand"
                        }
                        className="cursor-pointer"
                        height="18"
                      />
                    </span>
                  }
                >
                  {item.content.length > 0 ? (
                    <ul className="trace_history_list flex-fill overflow-auto p_x_4">
                      {Array.isArray(item.content) &&
                        item.content.map((itemContent, iC) => (
                          <li
                            key={iC}
                            className="d-flex flex-row justify-content-between rounded-1"
                          >
                            <span className="title">{itemContent}</span>
                            <div className="d-flex align-items-center">
                              <img
                                src={trash}
                                alt="trash"
                                className="cursor-pointer"
                                height="18"
                              />
                              <img
                                src={edit}
                                alt="edit"
                                className="cursor-pointer m_l_8"
                                height="16"
                              />
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="element-item-noData">{t("No Data")}</div>
                  )}
                </AccordionTab>
              ))}
            </Accordion>
          ) : (
            <div className="element-item-noData">{t("No Data History")}</div>
          )}
        </div>
      </div>

      <div className="subSidebar-widgets-footer p_x_16">
        {/* Action Buttons */}
        <div className="action-btns pt-3">
          <button className="btn_secondary m_0">
            <img src={trash} alt="trash" />
            {t("clear search history")}
          </button>
        </div>
      </div>
    </div>
  );
}
