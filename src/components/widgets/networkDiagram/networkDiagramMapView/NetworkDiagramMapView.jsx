import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "./NetworkDiagramMapView.scss";
import * as ReactDOM from "react-dom";
import {
  createMap,
  createNetworkDiagramMapView
} from "../../../../handlers/esriHandler";
import { setNetworkDiagramView } from "../../../../redux/widgets/networkDiagram/networkDiagramAction";

export default function NetworkDiagramMapView({ setLoading }) {
  // To use locales and directions
  const { t, i18n } = useTranslation("NetworkDiagramMapView");
  const direction = i18n.dir(i18n.language);

  // Hooks
  const dispatch = useDispatch();

  // Used to track the map
  const mapRef = useRef(null);

  // Selector to track the mapView
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);

  // Selector to track the language
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );
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
          extent:  utilityNetwork.fullExtent
        })
        // const view = await createNetworkDiagramMapView({
        //   container: mapRef.current,
        //   map: {
        //     basemap: null, // disables basemap
        //   },
        //   extent: utilityNetwork.fullExtent,
        // });
        view.when(async () => {
          //dispatch the view to the store
            dispatch(setNetworkDiagramView(view));
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

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
