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
  createUtilityNetwork,createLayerList,
  addLayersToMap,loadFeatureLayers,createBasemapGallery,createPad,createPrint
} from "../../handlers/esriHandler";
import { setView, setWebMap } from "../../redux/mapView/mapViewAction";
export default function MapView() {
  //to use locales
  const { t, i18n ,dir} = useTranslation("MapView");
  //hooks
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);
  const utilityNetworkSelector = useSelector((state) => state.traceReducer.utilityNetworkIntial);
  const layersData = useSelector((state) => state.traceReducer.traceLayersData);
  const language = useSelector((state) => state.layoutReducer.intialLanguage);
  const direction = i18n.dir(i18n.language);
  const basemapContainerRef = useRef(null);
  const layerListContainerRef = useRef(null);
  const padContainerRef = useRef(null);
  const printContainerRef = useRef(null);

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
          console.log("Utility Network", utilityNetwork);
          
          console.log("Utility Network's Domain Networks", utilityNetwork.dataElement.domainNetworks);

          // const unTraceConfigs = await loadFeatureLayers(`${utilityNetwork.networkServiceUrl}/traceConfigurations`)
          // console.log(unTraceConfigs,"unLayers");
          // // Extract trace configurations
          // const traceConfigurationsVar =
          // unTraceConfigs.traceConfigurations.map((config) => ({
          //     title: config.name,
          //     globalId: config.globalId,
          //   }));
          //   console.log(traceConfigurationsVar,"traceConfigurations");
            
          // // Dispatch trace configurations to Redux store
          // dispatch(setTraceConfigurations(traceConfigurationsVar));
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

    return () => {
      if (view) {
        console.log("Destroying MapView...");
        view.destroy();
      }
    };
  }, [language]);

    useEffect(()=>{
      if(!utilityNetworkSelector || !layersData)return
      if(utilityNetworkSelector.loaded && layersData.length>0){  
          loadAssetsData(utilityNetworkSelector,layersData).then((data) => {
            dispatch(setAssetsData(data));
          });
        }
    },[utilityNetworkSelector,layersData])

    const loadAssetsData = async (utilityNetwork,layers) => {
      try {
        // Extract domain networks from the utility network data element
        const domainNetworks = utilityNetwork.dataElement.domainNetworks;
        let result = { domainNetworks: [] };
        const layerMap = new Map(
          layers
            .filter(layer => layer && layer.id != null && layer.title != null).map(layer => [layer.id, layer.title])
        );
        domainNetworks.forEach((domainNetwork) => {
          let domainNetworkObj = {
            domainNetworkId: domainNetwork.domainNetworkId,
            domainNetworkName: domainNetwork.domainNetworkName,
            junctionSources: [],
            edgeSources: []
          };
    
          // Extract Junction Sources
          domainNetwork.junctionSources.forEach((junctionSource) => {
            let junctionSourceObj = {
              sourceId: junctionSource.sourceId,
              layerId: junctionSource.layerId,
              layerName: layerMap.get(String(junctionSource.layerId)) || "Not A Feature Layer",
              assetGroups: []
            };
    
            junctionSource.assetGroups.forEach((assetGroup) => {
              let assetGroupObj = {
                assetGroupCode: assetGroup.assetGroupCode,
                assetGroupName: assetGroup.assetGroupName,
                assetTypes: assetGroup.assetTypes.map((assetType) => ({
                  assetTypeCode: assetType.assetTypeCode,
                  assetTypeName: assetType.assetTypeName
                }))
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
              layerName: layerMap.get(String(edgeSource.layerId)) || "Not A Feature Layer",
              assetGroups: []
            };
    
            edgeSource.assetGroups.forEach((assetGroup) => {
              let assetGroupObj = {
                assetGroupCode: assetGroup.assetGroupCode,
                assetGroupName: assetGroup.assetGroupName,
                assetTypes: assetGroup.assetTypes.map((assetType) => ({
                  assetTypeCode: assetType.assetTypeCode,
                  assetTypeName: assetType.assetTypeName
                }))
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
        console.error("Unexpected error while loading utility network assets data", error);
        return null;
      }
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
          const isVisible = basemapContainerRef.current.style.display === "block";
          basemapContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      }}
    >
     {t("BaseMap")}
     </button>
    <button
      className="layerListToggle"
      onClick={() => {
        if (layerListContainerRef.current) {
          const isVisible = layerListContainerRef.current.style.display === "block";
          layerListContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      }}
    >
     {t("Layers")}
    </button>
    <button
      className="printToggle"
      onClick={() => {
        if (printContainerRef.current) {
          const isVisible = printContainerRef.current.style.display === "block";
          printContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      }}
    >
     {t("Print")}
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
