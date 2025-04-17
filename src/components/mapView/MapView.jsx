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
  createLayerList,
  addLayersToMap,
  makeEsriRequest,
  createBasemapGallery,
  createPad,
  createPrint,
  createReactiveUtils,
} from "../../handlers/esriHandler";
import { setView, setWebMap } from "../../redux/mapView/mapViewAction";
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
  const layersData = useSelector((state) => state.traceReducer.traceLayersData);
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const direction = i18n.dir(i18n.language);
  const basemapContainerRef = useRef(null);
  const layerListContainerRef = useRef(null);
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
          console.log("Utility Network", utilityNetwork);

          console.log(
            "Utility Network's Domain Networks",
            utilityNetwork.dataElement.domainNetworks
          );

        
          dispatch(
            setUtilityNetworkServiceUrl(utilityNetwork.networkServiceUrl)
          );
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
          // console.log(view.map,"Maaaaaaaaaaps");
          console.log("Layers", results);
          dispatch(setLayersData(results));
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
console.log(direction,"uiiiiiiiiiiii",viewSelector.ui);

    viewSelector.ui.move([layerListContainerRef.current, basemapContainerRef.current,printContainerRef.current], position);

    dispatch(setView(viewSelector));
    
  });
},[viewSelector,direction])
  useEffect(() => {
    if (!utilityNetworkSelector || !layersData) return;
    if (utilityNetworkSelector.loaded && layersData.length > 0) {
      loadAssetsData(utilityNetworkSelector, layersData).then((data) => {
        dispatch(setAssetsData(data));
      });
    }
  }, [utilityNetworkSelector, layersData]);

  const loadAssetsData = async (utilityNetwork, layers) => {
    try {
      // Extract domain networks from the utility network data element
      const domainNetworks = utilityNetwork.dataElement.domainNetworks;
      let result = { domainNetworks: [] };
      const layerMap = new Map(
        layers
          .filter((layer) => layer && layer.id != null && layer.title != null)
          .map((layer) => [layer.id, layer.title])
      );
      domainNetworks.forEach((domainNetwork) => {
        let domainNetworkObj = {
          domainNetworkId: domainNetwork.domainNetworkId,
          domainNetworkName: domainNetwork.domainNetworkName,
          junctionSources: [],
          edgeSources: [],
        };

        // Extract Junction Sources
        domainNetwork.junctionSources.forEach((junctionSource) => {
          let junctionSourceObj = {
            sourceId: junctionSource.sourceId,
            layerId: junctionSource.layerId,
            layerName:
              layerMap.get(String(junctionSource.layerId)) ||
              "Not A Feature Layer",
            assetGroups: [],
          };

          junctionSource.assetGroups.forEach((assetGroup) => {
            let assetGroupObj = {
              assetGroupCode: assetGroup.assetGroupCode,
              assetGroupName: assetGroup.assetGroupName,
              assetTypes: assetGroup.assetTypes.map((assetType) => ({
                assetTypeCode: assetType.assetTypeCode,
                assetTypeName: assetType.assetTypeName,
              })),
            };

            junctionSourceObj.assetGroups.push(assetGroupObj);
          });

          domainNetworkObj.junctionSources.push(junctionSourceObj);
        });

        // Extract Edge Sources
        domainNetwork.edgeSources.forEach((edgeSource) => {
          let edgeSourceObj = {
            sourceId: edgeSource.sourceId,
            layerId: edgeSource.layerId,
            layerName:
              layerMap.get(String(edgeSource.layerId)) || "Not A Feature Layer",
            assetGroups: [],
          };

          edgeSource.assetGroups.forEach((assetGroup) => {
            let assetGroupObj = {
              assetGroupCode: assetGroup.assetGroupCode,
              assetGroupName: assetGroup.assetGroupName,
              assetTypes: assetGroup.assetTypes.map((assetType) => ({
                assetTypeCode: assetType.assetTypeCode,
                assetTypeName: assetType.assetTypeName,
              })),
            };

            edgeSourceObj.assetGroups.push(assetGroupObj);
          });

          domainNetworkObj.edgeSources.push(edgeSourceObj);
        });

        result.domainNetworks.push(domainNetworkObj);
      });

      console.log("Assets Data", result);

      return result;
    } catch (error) {
      console.error(
        "Unexpected error while loading utility network assets data",
        error
      );
      return null;
    }
  };
  // Listen for extent changes
  useEffect(() => {
    if (!viewSelector) return;
    let handle;
    const init = async () => {
      const reactiveUtils = await createReactiveUtils();
      console.log(reactiveUtils);

      if (reactiveUtils) {
        handle = reactiveUtils.watch(
          () => [viewSelector.stationary],
          ([stationary]) => {
            if(stationary && !prevExtent.current ){
              debugger
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
