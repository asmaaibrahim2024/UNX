import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  setTraceConfigurations,
  setUtilityNetworkServiceUrl,
  setUtilityNetworkSpatialReference,
  setAssetsData,
  setUtilityNetwork,
  setLayersData,
} from "../../redux/widgets/trace/traceAction";
import "./MapView.scss";
import {
  createMapView,
  createWebMap,
  createMap,
  createUtilityNetwork,
  addLayersToMap,
} from "../../handlers/esriHandler";
import { setView, setWebMap } from "../../redux/mapView/mapViewAction";
export default function MapView() {
  //to use locales
  const { t, i18n } = useTranslation("MapView");
  //hooks
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);

  useEffect(() => {
    let view;
    let utilityNetwork;
    let myExtent = {
      xmin: 1025871.439005092,
      ymin: 1861241.5247562393,
      xmax: 1037672.4351865163,
      ymax: 1873159.6725078211,
      spatialReference: {
        wkid: 102671,
        latestWkid: 3435,
      },
    };
    const initializeMap = async () => {
      try {
        console.log("Initializing Map...");

        // Check if mapRef.current exists
        if (!mapRef.current) {
          console.error(
            "mapRef.current is null. Map container is not available."
          );
          return;
        }
        const myMap = await createMap();
        view = await createMapView({
          container: mapRef.current,
          map: myMap,
          extent: myExtent,
        });
        utilityNetwork = await createUtilityNetwork(
          window.mapConfig.portalUrls.utilityNetworkLayerUrl
        );
        await utilityNetwork.load();
        if(utilityNetwork){

          dispatch(setUtilityNetwork(utilityNetwork));
          // Extract trace configurations
          const traceConfigurations =
            utilityNetwork.sharedNamedTraceConfigurations.map((config) => ({
              title: config.title,
              globalId: config.globalId,
            }));
          // Dispatch trace configurations to Redux store
          dispatch(setTraceConfigurations(traceConfigurations));
          dispatch(setUtilityNetworkServiceUrl(utilityNetwork.networkServiceUrl));
          dispatch(
            setUtilityNetworkSpatialReference(utilityNetwork.spatialReference)
          );
        }
        view.when(async () => {
          //adding layers to the map and return them
          const results = await addLayersToMap(
            utilityNetwork.featureServiceUrl,
            view
          );
          dispatch(setView(view));
          console.log("MapView created successfully!", view);
          view.on("click", (event) => {
            view.hitTest(event).then((response) => {
              console.log(response, "response");
            });
          });
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();

    return () => {
      if (view) {
        console.log("Destroying MapView...");
        view.destroy();
      }
    };
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
