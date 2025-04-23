import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  setTraceConfigurations,
  setUtilityNetwork,
} from "../../redux/widgets/trace/traceAction";
import "./MapView.scss";
import {
  createMapView,
  createWebMap,
  createMap,
  createUtilityNetwork,
  createLayerList,
  addLayersToMap,
  makeEsriRequest,
  createBasemapGallery,
  createPad,
  createPrint,
  createReactiveUtils,createHomeWidget,createIntl
} from "../../handlers/esriHandler";
import { setView, setWebMap, 
  setLayersAndTablesData } from "../../redux/mapView/mapViewAction";
export default function MapView() {
  //to use locales
  const { t, i18n, dir } = useTranslation("MapView");
  //hooks
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);
  const utilityNetworkSelector = useSelector(
    (state) => state.traceReducer.utilityNetworkIntial
  );
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const direction = i18n.dir(i18n.language);
  const basemapContainerRef = useRef(null);
  const layerListContainerRef = useRef(null);
  const homeContainerRef = useRef(null);

  const padContainerRef = useRef(null);
  const printContainerRef = useRef(null);
  const extentHistory = useRef([]);
  const extentHistoryIndex = useRef(0);
  const nextExtent = useRef(false);
  const prevExtent = useRef(false);
  const preExtent = useRef(null);
  const currentExtent = useRef(null);
  const isPreviousDisabled =useRef(false)
  const isNextDisabled =useRef(false)

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
        if (utilityNetwork) {
          dispatch(setUtilityNetwork(utilityNetwork));
        }
        view.when(async () => {
          const featureServiceUrl = utilityNetwork.featureServiceUrl;
          //adding layers to the map and return them
          const layersAndTables = await addLayersToMap(
            featureServiceUrl,
            view
          );
          dispatch(setLayersAndTablesData(layersAndTables));
          // createLayerList(view).then((layerList)=>{
          //   const position = direction === 'rtl' ? 'top-left' : 'top-right';
          //   console.log(position,"position");

          //   view.ui.add(layerList, position);
          // })
          createLayerList(view).then(({ container }) => {
            layerListContainerRef.current = container;
            view.ui.add(container, "top-right"); // or wherever you want
          });
          createBasemapGallery(view).then(({ container }) => {
            basemapContainerRef.current = container;
            view.ui.add(container, "top-right");
          });
          createPrint(view).then(({ container }) => {
            printContainerRef.current = container;
            view.ui.add(container, "top-right");
          });
          // createPad(view).then(({ container }) => {
          //   padContainerRef.current = container;
          //   view.ui.add(container, "bottom-right");
          // });
          dispatch(setView(view));
          // console.log("MapView created successfully!", view);
          
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();
    //!it causes the add error when switch langauge
    // return () => {
    //   if (view) {
    //     console.log("Destroying MapView...");
    //     view.destroy();
    //   }
    // };
  }, []);
useEffect(()=>{
  if(!viewSelector) return;
  viewSelector.when(async () => {
    const position = direction === 'rtl' ? 'top-left' : 'top-right';
    viewSelector.ui.move([layerListContainerRef.current, basemapContainerRef.current,printContainerRef.current], position);
    dispatch(setView(viewSelector));
    createIntl().then((intl)=>{
      
      intl.setLocale(language);
    })
  });
},[viewSelector,direction,language])
 

  // Listen for extent changes
  useEffect(() => {
    if (!viewSelector) return;
    let handle;
    const init = async () => {
      const reactiveUtils = await createReactiveUtils();

      if (reactiveUtils) {
        handle = reactiveUtils.watch(
          () => [viewSelector.stationary],
          ([stationary]) => {
            if(stationary && !prevExtent.current ){
              extentChangeHandler(viewSelector.extent);
            }
          }
        );
      }
    };
    init();
    return () => {
      if (handle) {
        handle.remove();
      }
    };
  }, [viewSelector]);
  function extentChangeHandler(evt) {
    if(prevExtent.current || nextExtent.current){
      currentExtent.current = evt;
    }else{
      preExtent.current = currentExtent.current;
      currentExtent.current = evt;
      extentHistory.current.push({
        preExtent: preExtent.current,
        currentExtent: currentExtent.current
      });
      extentHistoryIndex.current = extentHistory.current.length - 1;
    }
    prevExtent.current = nextExtent.current = false;
    //extentHistoryChange();
  }
  function extentHistoryChange() {
    if(extentHistory.current === 0 || extentHistoryIndex.current === 0 ){
isPreviousDisabled.current = true    } else {
  isPreviousDisabled.current = false    }
    if(extentHistory.current === 0 || extentHistoryIndex.current === extentHistory.current - 1){
isNextDisabled.current = true    } else {
  isNextDisabled.current = false    }
  }
  const goToPreviousExtent = () => {
    if(extentHistory.current[extentHistoryIndex.current].preExtent){
      prevExtent.current = true;
      viewSelector.goTo(extentHistory.current[extentHistoryIndex.current].preExtent);
      extentHistoryIndex.current--;
    }
  };

  const goToNextExtent = () => {
    nextExtent.current = true;
    extentHistoryIndex.current++;
    viewSelector.goTo(extentHistory.current[extentHistory.current].currentExtent);
  };
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
        <button
          className="baseMapGallery"
          onClick={() => {
            if (basemapContainerRef.current) {
              const isVisible =
                basemapContainerRef.current.style.display === "block";
              basemapContainerRef.current.style.display = isVisible
                ? "none"
                : "block";
            }
          }}
        >
          {t("BaseMap")}
        </button>
        <button
          className="layerListToggle"
          onClick={() => {
            if (layerListContainerRef.current) {
              const isVisible =
                layerListContainerRef.current.style.display === "block";
              layerListContainerRef.current.style.display = isVisible
                ? "none"
                : "block";
            }
          }}
        >
          {t("Layers")}
        </button>

        <button
          className="printToggle"
          onClick={() => {
            if (printContainerRef.current) {
              const isVisible =
                printContainerRef.current.style.display === "block";
              printContainerRef.current.style.display = isVisible
                ? "none"
                : "block";
            }
          }}
        >
          {t("Print")}
        </button>
        <button className="prevExtent"  onClick={goToPreviousExtent}>
          {t("Previous Extent")}
        </button>
        <button className="nextExtent"  onClick={goToNextExtent}>
          {t("Next Extent")}
        </button>
        {/* <button
      className="padToggle"
      onClick={() => {
        if (padContainerRef.current) {
          const isVisible = padContainerRef.current.style.display === "block";
          padContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      }}
    >
      Pad
    </button> */}
      </div>
    </>
  );
}
