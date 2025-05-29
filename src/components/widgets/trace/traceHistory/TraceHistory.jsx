import { React, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  categorizeTraceResult,
  visualiseTraceGraphics,
  visualiseTraceQueriedFeatures,
  deleteAllTraceHistory,
  deleteTraceHistoryById,
  fetchTraceHistory,
  getElementsFeatures,
  queryTraceElements,
  getPointAtPercentAlong,
  fetchTraceResultHistoryById,
  performTrace,
} from "../traceHandler";
import "./TraceHistory.scss";
import { useI18n } from "../../../../handlers/languageHandler";
import edit from "../../../../style/images/edit-pen.svg";
import trash from "../../../../style/images/trash-03.svg";
import close from "../../../../style/images/x-close.svg";
import chevronleft from "../../../../style/images/chevron-left.svg";
import arrowup from "../../../../style/images/cheveron-up.svg";
import arrowdown from "../../../../style/images/cheveron-down.svg";
import search from "../../../../style/images/search.svg";
import date from "../../../../style/images/date.svg";
import dateTime from "../../../../style/images/dateTime.svg";
import { Calendar } from "primereact/calendar";
import { Accordion, AccordionTab } from "primereact/accordion";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
// import { InputText } from 'primereact/inputtext';
import {
  createGraphic,
  queryByGlobalId,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../../../../handlers/esriHandler";
import {
  clearTraceSelectedPoints,
  setGroupedTraceResultGlobalIds,
  setQueriedTraceResultFeaturesMap,
  setSelectedTraceTypes,
  setTraceConfigHighlights,
  setTraceResultsElements,
  setTraceSelectedPoints,
} from "../../../../redux/widgets/trace/traceAction";
import Swal from "sweetalert2";
import { addLocale } from "primereact/api";
import SweetAlert from "../../../../shared/uiControls/swalHelper/SwalHelper";

export default function TraceHistory({
  setActiveTab,
  setActiveButton,
  goToResultFrom,
  traceHistoryList,
  setTraceHistoryList,
}) {
  const { t, direction } = useI18n("Trace");
  const dispatch = useDispatch();
  const [activeIndex, setActiveIndex] = useState([0]); // Initialize with first tab open, adjust as needed
  const [isLoading, setIsLoading] = useState(!traceHistoryList);
  const [traceHistoryByDate, setTraceHistoryByDate] = useState([]);
  const [datetime12h, setDateTime12h] = useState(null);
  const [includeTime, setIncludeTime] = useState(true);
  const [deletingItems, setDeletingItems] = useState({});
  const [sourceToLayerMap, setSourceToLayerMap] = useState({});

  const traceGraphicsLayer = useSelector(
    (state) => state.traceReducer.traceGraphicsLayer
  );

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  const traceConfigurations = useSelector(
    (state) => state.traceReducer.traceConfigurations
  );

  const filteredTraceHistory = traceHistoryByDate
    .map((group) => {
      return {
        ...group,
        content: group.content.filter((item) => {
          if (!datetime12h) return true;

          const groupDateStr = group.name.match(/\(([^)]+)\)/)?.[1];
          if (!groupDateStr) return false;

          const itemDateTimeStr = `${groupDateStr} ${item.time}`;
          const itemDate = new Date(itemDateTimeStr);

          return includeTime
            ? itemDate.getFullYear() === datetime12h.getFullYear() &&
                itemDate.getMonth() === datetime12h.getMonth() &&
                itemDate.getDate() === datetime12h.getDate() &&
                itemDate.getHours() === datetime12h.getHours() &&
                itemDate.getMinutes() === datetime12h.getMinutes()
            : itemDate.toDateString() === datetime12h.toDateString();
        }),
      };
    })
    .filter((group) => group.content.length > 0);

  useEffect(() => {
    if (!utilityNetwork) return;

    // Extract sourceId -> layerId mapping
    const mapping = {};
    const domainNetworks = utilityNetwork?.dataElement?.domainNetworks;

    domainNetworks?.forEach((network) => {
      [...network.edgeSources, ...network.junctionSources].forEach((source) => {
        mapping[source.sourceId] = source.layerId;
      });
    });

    setSourceToLayerMap(mapping);
  }, [utilityNetwork]);

  useEffect(() => {
    const getTraceHistory = async () => {
      try {
        setIsLoading(true);
        const traceHistory = await fetchTraceHistory();
        const grouped = groupByDateLabel(traceHistory);
        setTraceHistoryByDate(grouped);
        setTraceHistoryList(grouped);
      } catch (e) {
        console.error(`Failed to get trace history`);
      } finally {
        setIsLoading(false);
      }
    };

    if (traceHistoryList) {
      setTraceHistoryByDate(traceHistoryList);
    } else {
      getTraceHistory();
    }
  }, []);

  useEffect(() => {
    if (!traceHistoryList) return;

    // Flatten existing grouped list back to raw format
    const rawHistory = traceHistoryList.flatMap((group) =>
      group.content.map((item) => {
        const dateStr = group.name.match(/\(([^)]+)\)/)?.[1]; // e.g., "2025-05-20"
        if (!dateStr) return null;

        const fullDateTime = new Date(`${dateStr} ${item.time}`);
        if (isNaN(fullDateTime)) return null;

        return {
          id: item.id,
          traceDate: fullDateTime.toISOString(),
          traceResultJson: item.traceResultJson,
        };
      }).filter(Boolean) // Remove nulls
    );

    const regrouped = groupByDateLabel(rawHistory);
    setTraceHistoryByDate(regrouped);
    setTraceHistoryList(regrouped);
  }, [t, direction]);


  const getDateLabel = (now, date) => {
    const msInDay = 1000 * 60 * 60 * 24;
    const diffTime = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(diffTime / msInDay);
    // const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
    const weekdayEn = date.toLocaleDateString("en-US", { weekday: "long" });

    if (diffDays === 0) return t("Today");
    if (diffDays === 1) return t("Yesterday");
    // if (diffDays < 7) return weekday;
    if (diffDays < 7) {
      switch (weekdayEn) {
        case "Sunday":
          return t("Sunday");
        case "Monday":
          return t("Monday");
        case "Tuesday":
          return t("Tuesday");
        case "Wednesday":
          return t("Wednesday");
        case "Thursday":
          return t("Thursday");
        case "Friday":
          return t("Friday");
        case "Saturday":
          return t("Saturday");
        default:
          return weekdayEn;
      }
    }

    if (diffDays < 14) return t("Last Week");
    if (diffDays < 21) return t("Two Weeks Ago");
    if (diffDays < 28) return t("Three Weeks Ago");
    if (diffDays < 60) return t("Last Month");
    if (diffDays < 90) return t("Two Months Ago");
    if (diffDays < 120) return t("Three Months Ago");
    if (diffDays < 365) {
      const monthsAgo = Math.floor(diffDays / 30);
      return `${monthsAgo} Months Ago`;
    }

    const yearsAgo = Math.floor(diffDays / 365);
    if (yearsAgo === 1) return t("Last Year");
    if (yearsAgo === 2) return t("Two Years Ago");
    if (yearsAgo === 3) return t("Three Years Ago");
    return `${yearsAgo} Years Ago`;
  };

  const groupByDateLabel = (data) => {
    const now = new Date();
    const result = {};

    data.forEach((item) => {
      const date = new Date(item.traceDate);
      const dateKey = date.toISOString().split("T")[0]; // "2025-05-20"
      const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (!result[dateKey]) {
        result[dateKey] = {
          dateObj: date,
          content: [],
        };
      }

      result[dateKey].content.push({
        id: item.id,
        time,
        traceResultJson: item.traceResultJson,
      });
    });

    // Convert to array with label like "Tuesday (2025-05-20)"
    return Object.entries(result).map(([dateKey, { dateObj, content }]) => {
      const label = getDateLabel(now, dateObj);
      return {
        name: `${label} (${dateKey})`,
        content,
      };
    });
  };

  const handleDelete = async (dateIndex, traceResultId) => {
    const htmlContentDelete = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_delete img"></span>
                                </div>
                                <h2 class="title_main">${t("Deleted!")}</h2>
                                <h2 class="title">${t(
                                  "Delete this trace history?"
                                )}</h2>
                            </div>`;

    SweetAlert(
      "30rem", // Width
      "", // Title
      "", // Title class
      htmlContentDelete, // HTML content
      true, // Show confirm button
      `${t("Delete")}`, // Confirm button text
      "btn btn-primary", // Confirm button class
      true, // Show cancel button
      `${t("Cancel")}`, // Cancel button text
      "btn btn-outline-secondary", // Cancel button class
      false, // Show close button
      "", // Close button class
      "", // Additional text
      "", // Icon
      "", // Container class
      "", // Popup class
      "", // Header class
      "", // Icon class
      "", // Image class
      "", // HTML container class
      "", // Input class
      "", // Input label class
      "", // Validation message class
      "", // Actions class
      "", // Deny button class
      "", // Loader class
      "", // Footer class
      "", // Timer progress bar class
      "",
      false,
      async () => {
        // Confirm callback
        deleteSingleTraceHistory(dateIndex, traceResultId);
      },
      () => {
        // Cancel callback
        // Action to take if the user cancels
        console.log("Deletion canceled");
      }
    );
  };

  const deleteSingleTraceHistory = async (dateIndex, traceResultId) => {
    try {
      // Set this item as deleting
      setDeletingItems((prev) => ({
        ...prev,
        [traceResultId]: true,
      }));
      // Delete from database
      const isDeleted = await deleteTraceHistoryById(traceResultId);

      if (isDeleted) {
        setTraceHistoryByDate((prev) => {
          const updated = [...prev];
          updated[dateIndex].content = updated[dateIndex].content.filter(
            (item) => item.id !== traceResultId
          );
          return updated.filter((group) => group.content.length > 0); // Remove empty date groups
        });
        showSuccessToast(t(`Trace result deleted successfully.`));
      }
    } catch (e) {
      console.error("Could not delete trace result");
    } finally {
      // Remove from deleting items regardless of success/failure
      setDeletingItems((prev) => {
        const newState = { ...prev };
        delete newState[traceResultId];
        return newState;
      });
    }
  };

  const getTraceResultHistory = async (traceResultId) => {
    try {
      setIsLoading(true);
      const traceResultHistory = await fetchTraceResultHistoryById(
        traceResultId
      );
      showTraceResult(traceResultHistory);
    } catch (e) {
      console.error("Could not get trace result json");
    }
  };

  const showTraceResult = async (traceResultHistory) => {
    try {
      // Clear graphics from trace graphics layer
      if (traceGraphicsLayer) {
        traceGraphicsLayer.removeAll();
      }
      // console.log("Trace Result:",traceResultHistory);

      // Query features by objectIds
      // const queriedTraceResultFeaturesMap = await queryTraceElements(traceResultHistory.groupedObjectIds, sourceToLayerMap, utilityNetwork.featureServiceUrl);

      // To create selected points graphics
      // traceResultHistory.traceLocations.forEach(async (point) => {
      //   let geometryToUse = queriedTraceResultFeaturesMap[point.globalId]?.geometry;
      //   if(!geometryToUse) {
      //     const allPoints = [
      //       ...(traceResultHistory.selectedPoints.Barriers || []),
      //       ...(traceResultHistory.selectedPoints.StartingPoints || [])
      //     ];

      //     for (const item of allPoints) {
      //       if (item[1] === point.globalId) {
      //         // item[3] = point's layerId
      //         const pointQuery = await queryByGlobalId(point.globalId, item[3], utilityNetwork.featureServiceUrl);
      //         geometryToUse = pointQuery[0]?.geometry;
      //       }
      //     }

      //   }
      //   if(geometryToUse?.type === "polyline"){
      //     geometryToUse = getPointAtPercentAlong(geometryToUse, point[3])
      //   }
      //   createGraphic(
      //     geometryToUse,
      //     {
      //       type: "simple-marker",
      //       style: "circle",
      //       color: point.traceLocationType === "startingPoint" ? [0, 255, 0, 0.8] : [255, 0, 0, 0.8],
      //       size: 20,
      //       outline: {
      //         width: 0
      //       }
      //     },
      //     { type: point.traceLocationType, id: `${point.globalId}-${point.percentAlong}`}
      //   ).then((selectedPointGraphic) => {
      //     traceGraphicsLayer.graphics.add(selectedPointGraphic);
      //   });
      // });

      // // To create trace results graphics
      // Object.entries(traceResultHistory.savedTraceGeometries).forEach(([graphicId, data]) => {
      //   if (data.type === "aggregatedGeometry") {

      //     const { graphicColor, strokeSize } = traceResultHistory.traceConfigHighlights[graphicId];

      //     const geomData = data.data;

      //     if (geomData.point) {

      //       createGraphic(
      //         {
      //           ...geomData.point,
      //           type: "multipoint"
      //         },
      //         {
      //           type: window.traceConfig.Symbols.multipointSymbol.type,
      //           color: graphicColor,
      //           size: window.traceConfig.Symbols.multipointSymbol.size,
      //           outline: {
      //             color: graphicColor,
      //             width: window.traceConfig.Symbols.multipointSymbol.outline.width
      //           }
      //         },
      //         { id: graphicId }
      //       ).then((multipointGraphic) => {
      //         traceGraphicsLayer.graphics.add(multipointGraphic);
      //       });
      //     }

      //     if (geomData.line) {
      //       createGraphic(
      //         {
      //           ...geomData.line,
      //           type: "polyline"
      //         },
      //         {
      //           type: window.traceConfig.Symbols.polylineSymbol.type,
      //           color: graphicColor,
      //           width: strokeSize
      //         },
      //         { id: graphicId }
      //       ).then((polylineGraphic) => {
      //         traceGraphicsLayer.graphics.add(polylineGraphic);
      //       });
      //     }

      //     if (geomData.polygon) {
      //       createGraphic(
      //         {
      //           ...geomData.polygon,
      //           type: "polygon"
      //         },
      //         {
      //           type: window.traceConfig.Symbols.polygonSymbol.type,
      //           color: graphicColor,
      //           style: window.traceConfig.Symbols.polygonSymbol.style,
      //           outline: {
      //             color: graphicColor,
      //             width: window.traceConfig.Symbols.polygonSymbol.outline.width
      //           }
      //         },
      //         { id: graphicId }
      //       ).then((polygonGraphic) => {
      //         traceGraphicsLayer.graphics.add(polygonGraphic);
      //       });
      //     }
      //   } else {
      //     const { graphicColor, strokeSize } = traceResultHistory.traceConfigHighlights[graphicId];
      //     const globalIds = data.data;
      //     let geometry;
      //     let symbol;
      //     globalIds.forEach(async (globalId) => {
      //       const feature = queriedTraceResultFeaturesMap[globalId];
      //       if (feature) {
      //         geometry = feature.geometry;
      //         switch (geometry.type) {
      //           case "point":
      //           case "multipoint":
      //             symbol = {
      //               type: window.traceConfig.Symbols.multipointSymbol.type,
      //               style: "circle",
      //               color: graphicColor,
      //               size: window.traceConfig.Symbols.multipointSymbol.size,
      //               outline: {
      //                 color: graphicColor,
      //                 width: window.traceConfig.Symbols.multipointSymbol.outline.width,
      //               },
      //             };
      //             break;

      //           case "polyline":
      //             symbol = {
      //               type: window.traceConfig.Symbols.polylineSymbol.type,
      //               color: graphicColor,
      //               width: strokeSize,
      //             };
      //             break;

      //           case "polygon":
      //             symbol = {
      //               type: window.traceConfig.Symbols.polygonSymbol.type,
      //               color: graphicColor,
      //               outline: {
      //                 color: graphicColor,
      //                 width: window.traceConfig.Symbols.polygonSymbol.outline.width,
      //               },
      //             };
      //             break;

      //           default:
      //             console.warn("Unknown geometry type:", geometry.type);
      //             break;
      //         }

      //         const graphic = await createGraphic(geometry, symbol, {id: graphicId});
      //         traceGraphicsLayer.graphics.add(graphic);
      //       } else {
      //         console.warn(`Global ID not found for creating a graphic: ${globalId}`);
      //       }
      //     });
      //   }
      // });

      // Reset Redux states to show selected result
      // dispatch(setQueriedTraceResultFeaturesMap(queriedTraceResultFeaturesMap));
      // dispatch(setTraceResultsElements(traceResultHistory.traceResultsElements));
      dispatch(
        setTraceConfigHighlights(traceResultHistory.traceConfigHighlights)
      );
      // dispatch(setGroupedTraceResultGlobalIds(traceResultHistory.groupedTraceResultGlobalIds));
      dispatch(setSelectedTraceTypes(traceResultHistory.selectedTraceTypes));
      dispatch(
        setTraceSelectedPoints(
          traceResultHistory.selectedPoints,
          traceResultHistory.traceLocations
        )
      );
      // dispatch

      // call performTrace
      await performTrace(
        true,
        t,
        utilityNetwork,
        setIsLoading,
        goToResultFrom,
        traceResultHistory.traceLocations,
        traceResultHistory.selectedTraceTypes,
        traceGraphicsLayer,
        traceResultHistory.traceConfigHighlights,
        setTraceResultsElements,
        dispatch,
        traceResultHistory.selectedPoints,
        traceConfigurations,
        sourceToLayerMap,
        setTraceConfigHighlights,
        setQueriedTraceResultFeaturesMap,
        setGroupedTraceResultGlobalIds
      );

      // // setActiveTab("result");
      // goToResultFrom("history");
    } catch (e) {
      console.log("An error occurred while showing trace result.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTraceHistory = async () => {
    if (traceHistoryByDate.length === 0) {
      showInfoToast(t("No trace hsitory to clear"));
      return;
    }
    // const result = await Swal.fire({
    //   title: t("Confirm"),
    //   text: t("Clear all trace history?"),
    //   showCancelButton: true,
    //   confirmButtonText: t("Yes"),
    //   cancelButtonText: t("No"),
    //   background: "#f9f9f9",
    //   color: "#333",
    //   buttonsStyling: false,
    //   customClass: {
    //     popup: "minimal-popup",
    //     confirmButton: "minimal-btn confirm",
    //     cancelButton: "minimal-btn cancel",
    //   },
    // });

    // if (result.isConfirmed) {
    //   try {
    //     setIsLoading(true);
    //     // Delete from database
    //     const isDeleted = await deleteAllTraceHistory();
    //     if (isDeleted) {
    //       setTraceHistoryByDate([]);
    //       showSuccessToast(t("Trace history cleared successfully."));
    //     }
    //   } catch (e) {
    //     console.error("Could not delete trace history");
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }
    ////////////////////
    const htmlContentDelete = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_delete img"></span>
                                </div>
                                <h2 class="title_main">${t("Deleted!")}</h2>
                                <h2 class="title">${t(
                                  "Clear all trace history?"
                                )}</h2>
                            </div>`;

    SweetAlert(
      "30rem", // Width
      "", // Title
      "", // Title class
      htmlContentDelete, // HTML content
      true, // Show confirm button
      `${t("Delete")}`, // Confirm button text
      "btn btn-primary", // Confirm button class
      true, // Show cancel button
      `${t("Cancel")}`, // Cancel button text
      "btn btn-outline-secondary", // Cancel button class
      false, // Show close button
      "", // Close button class
      "", // Additional text
      "", // Icon
      "", // Container class
      "", // Popup class
      "", // Header class
      "", // Icon class
      "", // Image class
      "", // HTML container class
      "", // Input class
      "", // Input label class
      "", // Validation message class
      "", // Actions class
      "", // Deny button class
      "", // Loader class
      "", // Footer class
      "", // Timer progress bar class
      "",
      false,
      async () => {
        // Confirm callback
        try {
          setIsLoading(true);
          // Delete from database
          const isDeleted = await deleteAllTraceHistory();
          if (isDeleted) {
            setTraceHistoryByDate([]);
            showSuccessToast(t("Trace history cleared successfully."));
          }
        } catch (e) {
          console.error("Could not delete trace history");
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        // Cancel callback
        // Action to take if the user cancels
        console.log("Deletion canceled");
      }
    );
  };

  addLocale("ar", {
    firstDayOfWeek: 6, // Saturday as first day
    showMonthAfterYear: true,
    dayNames: [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ],
    dayNamesShort: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
    dayNamesMin: ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
    monthNames: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    monthNamesShort: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    today: "اليوم",
    clear: "مسح",
    now: "الآن",
    pm: "م",
    am: "ص",
  });

  return (
    <div className="subSidebar-widgets-container trace-history">
      <div className="subSidebar-widgets-header trace-header">
        <div className="d-flex align-items-center">
          <img
            src={chevronleft}
            alt={t("back")}
            title={t("back")}
            className="cursor-pointer scale_nx"
            onClick={() => setActiveTab("input")}
          />
          <div className="container-title">{t("Trace History")}</div>
        </div>
        <img
          src={close}
          alt={t("close")}
          title={t("close")}
          className="cursor-pointer"
          onClick={() => dispatch(setActiveButton(""))}
        />
      </div>
      <div className="subSidebar-widgets-body trace-body">
        <div className="h-100 position-relative p-2 d-flex flex-column">
          {/*search by date time*/}
          <div className="flex-shrink-0 mb-2" style={{ position: "relative" }}>
            <IconField iconPosition="left" className="p-icon-field-custom">
              <InputIcon>
                <img src={search} alt="search" className="scale_nx" />
              </InputIcon>
              <Calendar
                placeholder={
                  includeTime
                    ? t("Search by date and time")
                    : t("Search by date only")
                }
                value={datetime12h}
                onChange={(e) => setDateTime12h(e.value)}
                // showTime
                showTime={includeTime}
                hourFormat="12"
                showButtonBar
                style={{ width: "100%" }}
                inputStyle={{ width: "100%" }}
                selectionMode="single" // Ensures popup closes on date selection
                locale={direction === "rtl" && "ar"}
              />
            </IconField>
            <button
              onClick={() => setIncludeTime((prev) => !prev)}
              style={{
                position: "absolute",
                [direction === "rtl" ? "left" : "right"]: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
              }}
              title={
                includeTime
                  ? t("Search by date and time")
                  : t("Search by date only")
              }
            >
              {/* {includeTime ? t("Time") : t("Date")} */}
              <img
                src={includeTime ? dateTime : date}
                alt={includeTime ? t("Time") : t("Date")}
                width="30"
                height="25"
              />
            </button>
          </div>
          {/* {!isLoading && traceHistoryByDate.length === 0 && (
            <div className="element-item-noData">
              {t("No trace history data.")}
            </div>
          )} */}
          {!isLoading && filteredTraceHistory.length === 0 && (
            <div className="element-item-noData">
              {traceHistoryByDate.length === 0
                ? t("No trace history data.")
                : datetime12h
                ? t("No results found for this search.")
                : t("No results match your criteria.")}
            </div>
          )}
          <Accordion
            multiple
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
            className="accordion-custom flex-fill overflow-auto p_x_4"
          >
            {/* {traceHistoryByDate.map((item, index) => ( */}
            {filteredTraceHistory.map((item, index) => (
              <AccordionTab
                key={index}
                header={
                  <span className="flex align-items-center gap-2 w-full d-flex justify-content-between">
                    <span className="font-bold white-space-nowrap">
                      {item.name}
                    </span>
                    <img
                      src={activeIndex.includes(index) ? arrowup : arrowdown}
                      alt={activeIndex.includes(index) ? "collapse" : "expand"}
                      className="cursor-pointer"
                      height="18"
                    />
                  </span>
                }
              >
                {/* <p>{item.content}</p> */}
                {item.content.length > 0 && (
                  <ul className="trace_history_list flex-fill overflow-auto p_x_4">
                    {Array.isArray(item.content) ? (
                      item.content.map((traceResult, iC) => (
                        <li
                          key={iC}
                          // className="d-flex flex-row justify-content-between rounded-1"
                          // onClick={() => showTraceResult(traceResult.traceResultJson)}
                          className={`d-flex flex-row justify-content-between rounded-1 ${
                            deletingItems[traceResult.id] ? "disabled-item" : ""
                          }`}
                          // onClick={() => !deletingItems[traceResult.id] && showTraceResult(traceResult.traceResultJson)}
                          onClick={() =>
                            !deletingItems[traceResult.id] &&
                            getTraceResultHistory(traceResult.id)
                          }
                        >
                          <span className="title">
                            {traceResult.time}
                            {deletingItems[traceResult.id] && (
                              <span className="deleting-text">
                                {" "}
                                {t("(Deleting...)")}
                              </span>
                            )}
                          </span>
                          <div className="d-flex align-items-center">
                            <img
                              src={trash}
                              alt="trash"
                              className="cursor-pointer"
                              height="18"
                              title={t("delete")}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering parent onClick
                                // handleDelete(index, traceResult.id);
                                if (!deletingItems[traceResult.id]) {
                                  handleDelete(index, traceResult.id);
                                }
                              }}
                            />
                            {/* <img
                              src={edit}
                              alt="edit"
                              className="cursor-pointer m_l_8"
                              height="16"
                            /> */}
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </ul>
                )}
              </AccordionTab>
            ))}
          </Accordion>
          {/* Loader */}
          {isLoading && (
            <div className="apploader_container apploader_container_widget">
              <div className="apploader"></div>
            </div>
          )}
        </div>
      </div>

      <div className="subSidebar-widgets-footer p_x_16">
        {/* Action Buttons */}
        <div className="action-btns pt-3">
          <button
            className="btn_secondary m_0"
            onClick={(e) => {
              handleClearTraceHistory();
            }}
            disabled={isLoading}
          >
            <img src={trash} alt="trash" />
            {t("Clear Trace History")}
          </button>
        </div>
      </div>
    </div>
  );
}
