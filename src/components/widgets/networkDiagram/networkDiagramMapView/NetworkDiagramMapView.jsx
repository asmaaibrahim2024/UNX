import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "./NetworkDiagramMapView.scss";
import * as ReactDOM from "react-dom";
import {
  createMap,
  createNetworkDiagramMapView,
} from "../../../../handlers/esriHandler";
import { setNetworkDiagramView } from "../../../../redux/widgets/networkDiagram/networkDiagramAction";
import exportIcon from "../../../../style/images/mg-map-tool-Export.svg";
import {
  getNetworkDiagramInfos,
  applyLayoutAlgorithm,
  makeRequest,
} from "../../networkDiagram/networkDiagramHandler";
export default function NetworkDiagramMapView({ setLoading }) {
  // To use locales and directions
  const { t, i18n } = useTranslation("NetworkDiagramMapView");
  const direction = i18n.dir(i18n.language);

  // Hooks
  const dispatch = useDispatch();

  // Used to track the map
  const mapRef = useRef(null);
  const exportDiagramButtonRef = useRef(null);

  // Selector to track the mapView
  const diagramExportUrl = useSelector(
    (state) => state.networkDiagramReducer.diagramExportUrlIntial
  );
  const token =
    "yOTqF0pRkuNeVTjHfdgHxTXj94PZ7f_1zKPKntvS0Lwl5PO2ydi-9ioRqhorcqkZ_ZyCDT-efut59VarY4jkugy_YGulwtNwQjP9Mm-ZxwhpXBO5al-CnGd1sHd31BCVL1MTpKpnwo05IGnhWWwgFJ9uytr1s58ucWuNpp3jWXwPD7R2pwY_Z6Qbq3yNFX9u";
  // Selector to track the language
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
  const exportDiagram = async () => {
    if (diagramExportUrl) {
      let postJson = {
        size: "800,600",
        token: token,
        f: "json",
      };
      const response = await makeRequest({
        method: "POST",
        url: diagramExportUrl,
        params: postJson,
      });

      if (response?.href) {
        try {
          const fileResponse = await fetch(response.href);
          const blob = await fileResponse.blob();

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "network_diagram.png"; // Or derive from response.href
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url); // Clean up after download
        } catch (err) {
          console.error("Download failed:", err);
        }
      }
    }
  };
  // Effect to intaiting the mapview
  useEffect(() => {
    //function to initiating the mapview
    const initializeMap = async () => {
      try {
        // Check if mapRef.current exists
        if (!mapRef.current) {
          console.error(
            "mapRef.current is null. Map container is not available."
          );
          return;
        }
        // //craete the basemap
        const myMap = await createMap();
        const view = await createNetworkDiagramMapView({
          container: mapRef.current,
          map: myMap,
          extent: utilityNetwork.fullExtent,
        });
        view.when(async () => {
          // const navContainer = document.createElement("div");

          // const exportButton = document.createElement("button");
          // exportButton.classList.add("esri-widget--button");
          // exportButton.title = t("Export Diagram");

          // const exportImg = document.createElement("img");
          // exportImg.src = exportIcon;
          // exportImg.alt = "Export";
          // exportButton.appendChild(exportImg);

          // exportButton.addEventListener("click", () => {
          //   console.log("Prev button clicked");
          //   exportDiagram();
          // });
          // exportDiagramButtonRef.current = exportButton;

          // navContainer.appendChild(exportButton);
          // view.ui.add(navContainer, "bottom-left");

          //dispatch the view to the store
          dispatch(setNetworkDiagramView(view));
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoading(false);
      }
    };

    initializeMap();
  }, []);
  useEffect(() => {
    if(diagramExportUrl){
                setLoading(false);

    }
    console.log(diagramExportUrl, "diagramExportUrlIntial");
  }, [diagramExportUrl]);
  return (
    <>
      <div
        className={`map_view d-flex flex-column h-100 position-relative h-100 `}
      >
        <div
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          className="the_map flex-fill"
        />
      </div>
    </>
  );
}
