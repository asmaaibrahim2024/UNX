import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setUtilityNetwork } from "../../redux/widgets/trace/traceAction";
import "./MapView.scss";
import Find from "../widgets/find/Find";
import * as ReactDOM from "react-dom";
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
  fetchNetowkrService,
} from "../../handlers/esriHandler";
import {
  setView,
  setLayersAndTablesData,
  setNetworkService,
} from "../../redux/mapView/mapViewAction";
import cursor from "../../style/images/cursor.svg";
import layer from "../../style/images/layers-three.svg";
import hand from "../../style/images/hand.svg";
import bookmark from "../../style/images/bookmark.svg";
import grid from "../../style/images/grid.svg";
import Ai from "../../style/images/AI.svg";
import print from "../../style/images/printer.svg";
import menu from "../../style/images/menu.svg";
import arrowright from "../../style/images/arrow-narrow-right.svg";
import arrowleft from "../../style/images/arrow-narrow-left.svg";
import BookMark from "../widgets/bookMark/BookMark";
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
  const layerContainerRef = useRef(null);
  const bookMarkContainerRef = useRef(null);
  const gridContainerRef = useRef(null);
  const aiContainerRef = useRef(null);
  const menuContainerRef = useRef(null);

  // Used to track the print
  const printContainerRef = useRef(null);

  //for tooltips
  const printButtonRef = useRef(null);
  const selectButtonRef = useRef(null);
  const panButtonRef = useRef(null);
  const layerListButtonRef = useRef(null);
  const basemapGalleryButtonRef = useRef(null);
  const bookmarkButtonRef = useRef(null);
  const aiButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
const prevExtentButtonRef= useRef(null);
const nextExtentButtonRef= useRef(null);

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
  const [isBookMarkVisible, setIsBookMarkVisible] = useState(false);

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
        // //craete the basemap
        // const myMap = await createMap();
        // //create the view
        // const { view: createdView, customButtonsContainer } =
        //   await createMapView({
        //     container: mapRef.current,
        //     map: myMap,
        //     extent: myExtent,
        //   });
        // view = createdView;

        const networkService = await fetchNetowkrService(4);
        dispatch(setNetworkService(networkService));
      

        //create the utility network and dispatch to the store
        utilityNetwork = await createUtilityNetwork(networkService.serviceUrl);

        await utilityNetwork.load();
        if (utilityNetwork) {
          dispatch(setUtilityNetwork(utilityNetwork));
          
          
        }


        //craete the basemap
        const myMap = await createMap();
        //create the view
        const { view: createdView, customButtonsContainer } =
          await createMapView({
            container: mapRef.current,
            map: myMap,
            extent: utilityNetwork ? utilityNetwork.fullExtent : myExtent ,
          });
        view = createdView;




        view.when(async () => {
          const featureServiceUrl = utilityNetwork.featureServiceUrl;
          //adding layers to the map and return them
          const layersAndTables = await addLayersToMap(featureServiceUrl, view);
          //dispatch the layers to th estore
          dispatch(setLayersAndTablesData(layersAndTables));
                    // Create a function to hide all containers
                    const hideAllWidgets = () => {
                      if (layerListContainerRef.current) {
                        layerListContainerRef.current.style.display = "none";
                      }
                      if (basemapContainerRef.current) {
                        basemapContainerRef.current.style.display = "none";
                      }
                      if (printContainerRef.current) {
                        printContainerRef.current.style.display = "none";
                      }
                    };
          const [
            layerListResult,
            basemapResult,
            printResult
          ] = await Promise.all([
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
          const selectButton = document.createElement("button");
          const selectImg = document.createElement("img");
          selectImg.src = cursor;
          selectImg.width = 25;
          selectImg.height = 24;
          selectButton.title= t("Select")
          selectButton.appendChild(selectImg);

          selectButton.onclick = () => {
            console.log("select");
          };

          const panButton = document.createElement("button");
          panButton.className = "";
          const panImg = document.createElement("img");
          panImg.src = hand;
          panImg.width = 25;
          panImg.height = 24;
          panButton.title= t("Pan")
          panButton.appendChild(panImg);

          panButton.onclick = () => {
            console.log("pan");
          };

          const printButton = document.createElement("button");
          printButton.className = "";
          const printImg = document.createElement("img");
          printImg.src = print;
          printImg.width = 25;
          printImg.height = 24;
          printButton.title = t("Print");
          printButton.appendChild(printImg);
          printButton.onclick = () => {
            if (printContainerRef.current) {
              const isVisible =
                printContainerRef.current.style.display === "block";
              hideAllWidgets();
              if (!isVisible) {
                printContainerRef.current.style.display = "block";
              }
            }
          };

          const layerListButton = document.createElement("button");
          const layerListImg = document.createElement("img");
          layerListImg.src = layer;
          layerListImg.width = 25;
          layerListImg.height = 24;
          layerListButton.title = t("Layers");
          layerListButton.appendChild(layerListImg);

          layerListButton.onclick = () => {
            if (layerListContainerRef.current) {
              const isVisible =
                layerListContainerRef.current.style.display === "block";
              hideAllWidgets(); // First hide all widgets
              if (!isVisible) {
                layerListContainerRef.current.style.display = "block"; // Then show this one if it was hidden
              }
            }
          };

          const bookMarkButton = document.createElement("button");
          const bookMarkImg = document.createElement("img");
          bookMarkImg.src = bookmark;
          bookMarkImg.width = 25;
          bookMarkImg.height = 24;
          bookMarkButton.title = t("BookMarks");
          bookMarkButton.appendChild(bookMarkImg);

          bookMarkButton.onclick = () => {
            console.log("bookmark");
            setIsBookMarkVisible(!isBookMarkVisible)
          };

          const baseMapGalleryButton = document.createElement("button");
          const baseMapGalleryImg = document.createElement("img");
          baseMapGalleryImg.src = grid;
          baseMapGalleryImg.width = 25;
          baseMapGalleryImg.height = 24;
          baseMapGalleryButton.title = t("BaseMap");
          baseMapGalleryButton.appendChild(baseMapGalleryImg);

          baseMapGalleryButton.onclick = () => {
            if (basemapContainerRef.current) {
              const isVisible =
                basemapContainerRef.current.style.display === "block";
              hideAllWidgets();
              if (!isVisible) {
                basemapContainerRef.current.style.display = "block";
              }
            }
          };

          const aiButton = document.createElement("button");
          const aiImg = document.createElement("img");
          aiImg.src = Ai;
          aiImg.width = 25;
          aiImg.height = 24;
          aiButton.title=t("GeoAI Chat")
          aiButton.appendChild(aiImg);

          aiButton.onclick = () => {
            console.log("ai");
          };

          const menuButton = document.createElement("button");
          const menuImg = document.createElement("img");
          menuImg.src = menu;
          menuImg.width = 25;
          menuImg.height = 24;
          menuButton.title=t("Menu")
          menuButton.appendChild(menuImg);

          menuButton.onclick = () => {
            console.log("menuButton");
          };
          // Add buttons to container
          // Save button to ref for later use
          selectButtonRef.current = selectButton;
          customButtonsContainer.appendChild(selectButton);
          panButtonRef.current = panButton;
          customButtonsContainer.appendChild(panButton);
          layerListButtonRef.current = layerListButton;
          customButtonsContainer.appendChild(layerListButton);
          bookmarkButtonRef.current = bookMarkButton;
          customButtonsContainer.appendChild(bookMarkButton);
          printButtonRef.current = printButton;
          customButtonsContainer.appendChild(printButton);
          basemapGalleryButtonRef.current = baseMapGalleryButton;
          customButtonsContainer.appendChild(baseMapGalleryButton);
          aiButtonRef.current = aiButton;
          customButtonsContainer.appendChild(aiButton);
          menuButtonRef.current = menuButton;
          customButtonsContainer.appendChild(menuButton);

          const findContainer = document.createElement("div");
          findContainer.className = "find-widget-container";
          mapRef.current.appendChild(findContainer);
          findContainerRef.current = findContainer;

          // Add the Find widget to the view UI
          findWidgetRef.current = view.ui.add(findContainer, {
            position: "top-left",
            index: 0,
          });
          const navContainer = document.createElement("div");

          // Previous Button
          const prevButton = document.createElement("button");
          prevButton.classList.add("esri-widget--button");
          prevButton.disabled = isPreviousDisabled.current;
          prevButton.title = t("Previous Extent");
        
          const prevImg = document.createElement("img");
          prevImg.src = arrowleft;
          prevImg.alt = "Previous";
          prevButton.appendChild(prevImg);
        
          prevButton.addEventListener("click", () => {
            console.log("Prev button clicked");
            goToPreviousExtent(view);
          });
        
          // Next Button
          const nextButton = document.createElement("button");
          nextButton.classList.add("esri-widget--button");
          nextButton.disabled = isNextDisabled.current;
          nextButton.title = t("Next Extent");
        
          const nextImg = document.createElement("img");
          nextImg.src = arrowright;
          nextImg.alt = "Next";
          nextButton.appendChild(nextImg);
        
          nextButton.addEventListener("click", () => {
            goToNextExtent(view);
          });
        
          prevExtentButtonRef.current = prevButton;
          nextExtentButtonRef.current = nextButton;
        
          navContainer.appendChild(prevButton);
          navContainer.appendChild(nextButton);

          // Add container to view UI
          view.ui.add(navContainer, "bottom-left");
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
      //update button title
      if (printButtonRef.current) {
        printButtonRef.current.title = t("Print");
      }
      if (layerListButtonRef.current) {
        layerListButtonRef.current.title = t("Layers");
      }
      if (bookmarkButtonRef.current) {
        bookmarkButtonRef.current.title = t("BookMarks");
      }
      if (basemapGalleryButtonRef.current) {
        basemapGalleryButtonRef.current.title = t("BaseMap");
      }
      if (selectButtonRef.current) {
        selectButtonRef.current.title = t("Select");
      }
      if (panButtonRef.current) {
        panButtonRef.current.title = t("Pan");
      }
      if (aiButtonRef.current) {
        aiButtonRef.current.title = t("GeoAI Chat");
      }
      if (menuButtonRef.current) {
        menuButtonRef.current.title = t("Menu");
      }
      if (prevExtentButtonRef.current) {
        prevExtentButtonRef.current.title = t("Previous Extent");
      }
      if (nextExtentButtonRef.current) {
        nextExtentButtonRef.current.title = t("Next Extent");
      }
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
// Watch for view extent changes
useEffect(() => {
  if (!viewSelector) return;

  let handle;

  const init = async () => {
    const reactiveUtils = await createReactiveUtils();
    if (!reactiveUtils) return;

    handle = reactiveUtils.watch(
      () => [viewSelector.stationary],
      ([stationary]) => {
        if (stationary) {
          if (!prevExtent.current && !nextExtent.current) {
            extentChangeHandler(viewSelector.extent);
          } else {
            prevExtent.current = false;
            nextExtent.current = false;
          }
        }
      }
    );
  };

  init();

  return () => {
    if (handle) handle.remove();
  };
}, [viewSelector]);

function extentChangeHandler(newExtent) {
  if (extentHistory.current.length === 0) {
    currentExtent.current = newExtent;
    extentHistory.current.push({
      preExtent: null,
      currentExtent: newExtent,
    });
    extentHistoryIndex.current = 0;
  } else {
    const prev = currentExtent.current;
    currentExtent.current = newExtent;
    extentHistory.current.push({
      preExtent: prev,
      currentExtent: newExtent,
    });
    extentHistoryIndex.current = extentHistory.current.length - 1;
  }

  updateButtons();
}

function updateButtons() {
  isPreviousDisabled.current = extentHistoryIndex.current <= 0;
  isNextDisabled.current = extentHistoryIndex.current >= extentHistory.current.length - 1;

  // Update actual DOM buttons if they exist
  if (prevExtentButtonRef.current)
    prevExtentButtonRef.current.disabled = isPreviousDisabled.current;

  if (nextExtentButtonRef.current)
    nextExtentButtonRef.current.disabled = isNextDisabled.current;

  forceUpdate((n) => n + 1); // optional if other UI depends on this
}

const goToPreviousExtent = (view) => {
  if (extentHistoryIndex.current > 0) {
    prevExtent.current = true;
    extentHistoryIndex.current--;

    const prev = extentHistory.current[extentHistoryIndex.current];
    if (prev?.currentExtent) {
      console.log(view,"viewSelector");
      
      view.goTo(prev.currentExtent);
    }

    updateButtons();
  }
};

const goToNextExtent = (view) => {
  if (extentHistoryIndex.current < extentHistory.current.length - 1) {
    nextExtent.current = true;
    extentHistoryIndex.current++;

    const next = extentHistory.current[extentHistoryIndex.current];
    if (next?.currentExtent) {
      view.goTo(next.currentExtent);
    }

    updateButtons();
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
                {/* <BookMark isVisible={isBookMarkVisible}/> */}
                <BookMark isVisible={true}/>

      </div>
    </>
  );
}
