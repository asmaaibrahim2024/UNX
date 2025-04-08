import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import './MapView.scss'
import {
    createMapView,createWebMap
} from "../../handlers/esriHandler";
import {
    setView,setWebMap
} from "../../redux/mapView/mapViewAction";
export default function MapView() {
    //to use locales
    const { t, i18n } = useTranslation("MapView");
    //hooks
    const dispatch = useDispatch();
    const mapRef = useRef(null);
    const viewSelector = useSelector((state) => state.mapViewReducer.intialView);

    useEffect(() => {
        let view;
        let webMap;
console.log(window.mapConfig.portalUrls);

        const initializeMap = async () => {
            try {
                console.log("Initializing Map...");

                // Check if mapRef.current exists
                if (!mapRef.current) {
                    console.error("mapRef.current is null. Map container is not available.");
                    return;
                }

              webMap = await createWebMap(window.mapConfig.portalUrls.portalUrl,window.mapConfig.portalUrls.portalItemIdEn)
              webMap.when(()=>{

                dispatch(setWebMap(webMap))
                  console.log("Creating MapView...",webMap?.utilityNetworks.items[0]);
 
              })
                view = await createMapView({
                    container: mapRef.current,
                    map:webMap
                });
                view.when(()=>{

                    dispatch(setView(view))
                    console.log("MapView created successfully!",view);
                })
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
useEffect(()=>{
    console.log(viewSelector,"viewSelector");
    
},[viewSelector])
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
          {/* <BookMark /> */}
            </div>
        </>
    );
}
