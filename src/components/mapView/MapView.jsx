import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  setUtilityNetwork,
} from "../../redux/widgets/trace/traceAction";
import "./MapView.scss";
import Find from "../widgets/find/Find";
import * as ReactDOM from 'react-dom';
import {
  createMapView,
  createMap,
  createUtilityNetwork,
  createLayerList,
  addLayersToMap,
  createBasemapGallery,
  createPrint,
  createReactiveUtils,
  createIntl,
} from "../../handlers/esriHandler";
import {
  setView,
  setLayersAndTablesData,
} from "../../redux/mapView/mapViewAction";
export default function MapView() {
  // To use locales and directions
  const { t, i18n } = useTranslation("MapView");
  const direction = i18n.dir(i18n.language);
  const findContainerRef = useRef(null);
  const findWidgetRef = useRef(null);
  // Hooks
  const dispatch = useDispatch();

  // Used to track the map
  const mapRef = useRef(null);

  // Selector to track the mapView
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);

  // Selector to track the language
  const language = useSelector((state) => state.layoutReducer.intialLanguage);

  // Used to track the basemapGallery
  const basemapContainerRef = useRef(null);

  // Used to track the layerList
  const layerListContainerRef = useRef(null);

  // Used to track the print
  const printContainerRef = useRef(null);

  // Used to flag when we're navigating back in history (Previous button clicked)
  const prevExtent = useRef(false);

  // Used to flag when we're navigating forward in history (Next button clicked)
  const nextExtent = useRef(false);

  // Holds the latest extent (the current map view)
  const currentExtent = useRef(null);

  // Stores the history of all extents (movements done by user)
  const extentHistory = useRef([]);

  // Keeps track of the current position inside extentHistory
  const extentHistoryIndex = useRef(-1);

  // Controls if the "Previous" button should be disabled
  const isPreviousDisabled = useRef(true);

  // Controls if the "Next" button should be disabled
  const isNextDisabled = useRef(true);

  // Used to force a re-render (because refs don't cause rerenders)
  const [, forceUpdate] = useState(0);

  // Effect to intaiting the mapview
  useEffect(() => {
    //variables to store the view and the utility network
    let view;
    let utilityNetwork;

    //initial extent
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
        //craete the basemap
        const myMap = await createMap();
        //create the view
        const { view: createdView, customButtonsContainer } = await createMapView({
          container: mapRef.current,
          map: myMap,
          extent: myExtent,
        });
        view = createdView;
        //create the utility network and dispatch to the store
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
          const layersAndTables = await addLayersToMap(featureServiceUrl, view);
          //dispatch the layers to th estore
          dispatch(setLayersAndTablesData(layersAndTables));
          const [layerListResult, basemapResult, printResult] = await Promise.all([
            createLayerList(view),
            createBasemapGallery(view),
            createPrint(view)
          ]);
    
          // Set up layer list
          layerListContainerRef.current = layerListResult.container;
          view.ui.add(layerListResult.container, "top-right");
    
          // Set up basemap gallery
          basemapContainerRef.current = basemapResult.container;
          view.ui.add(basemapResult.container, "top-right");
    
          // Set up print widget
          printContainerRef.current = printResult.container;
          view.ui.add(printResult.container, "top-right");
           // Create buttons
      const basemapButton = document.createElement("button");
      basemapButton.className = "baseMapGallery";
      basemapButton.textContent = t("BaseMap");
      basemapButton.onclick = () => {
        if (basemapContainerRef.current) {
          const isVisible = basemapContainerRef.current.style.display === "block";
          basemapContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      };

      const layerListButton = document.createElement("button");
      layerListButton.className = "layerListToggle";
      layerListButton.textContent = t("Layers");
      layerListButton.onclick = () => {
        if (layerListContainerRef.current) {
          const isVisible = layerListContainerRef.current.style.display === "block";
          layerListContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      };

      const printButton = document.createElement("button");
      printButton.className = "printToggle";
      printButton.textContent = t("Print");
      printButton.onclick = () => {
        if (printContainerRef.current) {
          const isVisible = printContainerRef.current.style.display === "block";
          printContainerRef.current.style.display = isVisible ? "none" : "block";
        }
      };
      // Add buttons to container
      customButtonsContainer.appendChild(basemapButton);
      customButtonsContainer.appendChild(layerListButton);
      customButtonsContainer.appendChild(printButton);

          const findContainer = document.createElement('div');
      findContainer.className = 'find-widget-container';
      mapRef.current.appendChild(findContainer);
      findContainerRef.current = findContainer;

      // Add the Find widget to the view UI
      findWidgetRef.current = view.ui.add(findContainer, {
        position: "top-left",
        index: 0
      });
          //dispatch the view to the store
          dispatch(setView(view));
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initializeMap();
  }, []);

  // Effect to change the Esri widgets positions when change language and locales
  useEffect(() => {
    if (!viewSelector) return;
    viewSelector.when(async () => {
      const position = direction === "rtl" ? "top-left" : "top-right";
      viewSelector.ui.move(
        [
          layerListContainerRef.current,
          basemapContainerRef.current,
          printContainerRef.current,
        ],
        position
      );
      dispatch(setView(viewSelector));
      createIntl().then((intl) => {
        intl.setLocale(language);
      });
    });
  }, [viewSelector, direction, language]);

  // Effect to start watching view changes (stationary)
  useEffect(() => {
    if (!viewSelector) return; // No viewSelector? Exit early.
    let handle; // Will store the reactiveUtils handle

    const init = async () => {
      const reactiveUtils = await createReactiveUtils(); // Dynamically import reactiveUtils (helper for watching)

      if (reactiveUtils) {
        // Watch when the view becomes stationary (after moving/zooming)
        handle = reactiveUtils.watch(
          () => [viewSelector.stationary], // watch 'stationary' property
          ([stationary]) => {
            if (stationary) {
              if (!prevExtent.current && !nextExtent.current) {
                // Only record extent if it's a normal move, not a history navigation
                extentChangeHandler(viewSelector.extent);
              } else {
                // If it was triggered by Previous/Next button, just reset the flags
                prevExtent.current = false;
                nextExtent.current = false;
              }
            }
          }
        );
      }
    };

    init(); // Call init()

    return () => {
      // Cleanup function to remove watcher when viewSelector changes
      if (handle) {
        handle.remove();
      }
    };
  }, [viewSelector]);

  // Function to handle extent changes 
  function extentChangeHandler(newExtent) {
    debugger
    if (extentHistory.current.length === 0) {
      // First extent in history (first move or initial load)
      currentExtent.current = newExtent;
      extentHistory.current.push({
        preExtent: null, // No previous extent at first
        currentExtent: newExtent,
      });
      extentHistoryIndex.current = 0; // Point to the first entry
    } else {
      // Normal extent change (user zoomed/moved)
      const prev = currentExtent.current; // Save current as previous
      currentExtent.current = newExtent; // Update current
      extentHistory.current.push({
        preExtent: prev, // Save where we came from
        currentExtent: newExtent, // Save where we are now
      });
      extentHistoryIndex.current = extentHistory.current.length - 1; // Move to the latest index
    }

    updateButtons(); // Update the Previous/Next button states
  }

  // Function to update button enabled/disabled states
  function updateButtons() {
    // Disable Previous if we are at the very beginning of history
    isPreviousDisabled.current = extentHistoryIndex.current <= 0;

    // Disable Next if we are at the very end of history
    isNextDisabled.current =
      extentHistoryIndex.current >= extentHistory.current.length - 1;

    forceUpdate((n) => n + 1); // Force re-render so button UI updates
  }

  // Function to go to the previous extent
  const goToPreviousExtent = () => {
    if (extentHistoryIndex.current > 0) {
      // Only if we are not already at the start
      prevExtent.current = true; // Mark that we are moving backward
      extentHistoryIndex.current--; // Move back one in history

      const prev = extentHistory.current[extentHistoryIndex.current]; // Get the previous extent
      if (prev?.currentExtent) {
        viewSelector.goTo(prev.currentExtent); // Move the map view
      }

      updateButtons(); // Update buttons after moving
    }
  };

  // Function to go to the next extent
  const goToNextExtent = () => {
    if (extentHistoryIndex.current < extentHistory.current.length - 1) {
      // Only if not already at the latest
      nextExtent.current = true; // Mark that we are moving forward
      extentHistoryIndex.current++; // Move forward one in history

      const next = extentHistory.current[extentHistoryIndex.current]; // Get the next extent
      if (next?.currentExtent) {
        viewSelector.goTo(next.currentExtent); // Move the map view
      }

      updateButtons(); // Update buttons after moving
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
         {findContainerRef.current && (
          <Find isVisible={true} container={findContainerRef.current} />
        )}
        {/* <button
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
        </button> */}
        <button
          className="prevExtent"
          disabled={isPreviousDisabled.current}
          onClick={goToPreviousExtent}
        >
          {t("Previous Extent")}
        </button>
        <button
          className="nextExtent"
          disabled={isNextDisabled.current}
          onClick={goToNextExtent}
        >
          {t("Next Extent")}
        </button>
      </div>
    </>
  );
}
