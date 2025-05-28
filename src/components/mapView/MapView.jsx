import { React, useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setUtilityNetwork } from "../../redux/mapView/mapViewAction";
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
  selectFeatures,
  stopSketch,
  getFilteredAttributesByFields,
  getDomainValues,
  getAttributeCaseInsensitive,
  fetchBookmarksByIdFromDatabase,
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
import MapSetting from "../mapSetting/MapSetting";
import BookMark from "../widgets/bookMark/BookMark";

import { setSelectedFeatures } from "../../redux/widgets/selection/selectionAction";
import { setActiveButton } from "../../redux/sidebar/sidebarAction";
import FeaturePopup from "./featurePopup/FeaturePopup";

import store from "../../redux/store";
import { useSketchVM } from "../layout/sketchVMContext/SketchVMContext";
import { throttle } from "rxjs";
import ShowConnection from "../commonComponents/showConnection/ShowConnection";
import { useSearchParams } from "react-router-dom";
import { setZIndexPanel } from "../../redux/ui/uiAction";
export default function MapView({ setLoading }) {
  // To use locales and directions
  const { t, i18n } = useTranslation("MapView");
  const direction = i18n.dir(i18n.language);
  const findContainerRef = useRef(null);
  const findWidgetRef = useRef(null);
  // Hooks
  const dispatch = useDispatch();
  const zIndexPanel = useSelector((state) => state.uiReducer.zIndexPanel);

  // Used to track the map
  const mapRef = useRef(null);

  // Selector to track the mapView
  const viewSelector = useSelector((state) => state.mapViewReducer.intialView);

  // Selector to track the language
  const language = useSelector((state) => state.layoutReducer.intialLanguage);

  // Selector to track the current opened side panel
  const activeButton = useSelector(
    (state) => state.sidebarReducer.activeButton
  );

  // Selector to track the map setting visibility
  const mapSettingVisiblity = useSelector(
    (state) => state.mapSettingReducer.mapSettingVisiblity
  );

  const utilityNetwork = useSelector(
    (state) => state.mapSettingReducer.utilityNetworkMapSetting
  );

  //selector to track selector features to use in the select features button
  const selectedFeatures = useSelector(
    (state) => state.selectionReducer.selectedFeatures
  );

  //selector to track the network service
  const networkService = useSelector(
    (state) => state.mapSettingReducer.networkServiceConfig
  );

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
  const prevExtentButtonRef = useRef(null);
  const nextExtentButtonRef = useRef(null);
  const customButtonsContainerRef = useRef(null);

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

  // to store the sketch in order to stop it
  const { sketchVMRef } = useSketchVM();
  // const sketchVMRef = useRef(null);

  // to refrence the element of the popup when a feature is clicked
  const popupRef = useRef(null);

  // Used to force a re-render (because refs don't cause rerenders)
  const [, forceUpdate] = useState(0);
  // const [showBookmarks, setShowBookmarks] = useState(false);

  // to store the clicked features to show popup
  const [clickedFeatures, setClickedFeatures] = useState([]);

  // to store the clicked features to show popup
  const [currentFeature, setCurrentFeature] = useState(null);

  // to store the current clicked feature index to show popup
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const [searchParams] = useSearchParams();
  const bookmarkId = searchParams.get("bookmarkid");

  const isConnectionVisible = useSelector(
    (state) => state.showConnectionReducer.isConnectionVisible
  );

  const bookmarkContainerRef = useRef(null);

  // effect to hide all opened widgets when the network service is changed
  useEffect(() => {
    hideAllWidgets();
    deactivateAllButtonsExceptSelectPan();
    deactivateSelectPan();
  }, [networkService]);

  const deactivateAllButtonsExceptSelectPan = () => {
    const buttons = [
      layerListButtonRef.current,
      bookmarkButtonRef.current,
      printButtonRef.current,
      basemapGalleryButtonRef.current,
      aiButtonRef.current,
      menuButtonRef.current,
    ];

    buttons.forEach((button) => {
      if (button) {
        button.classList.remove("active");
      }
    });
  };
  const deactivateSelectPan = () => {
    const buttons = [selectButtonRef.current, panButtonRef.current];

    buttons.forEach((button) => {
      if (button) {
        button.classList.remove("active");
      }
    });
  };
  const toggleActiveButton = (button) => {
    const isActive = button.classList.contains("active");
    deactivateAllButtonsExceptSelectPan();
    if (!isActive) {
      button.classList.add("active");
    }
    return !isActive; // Returns true if button is now active, false if it's now inactive
  };
  const toggleSelectPanActiveButton = (button) => {
    const isActive = button.classList.contains("active");

    deactivateSelectPan();
    if (!isActive) {
      button.classList.add("active");
    }
    return !isActive; // Returns true if button is now active, false if it's now inactive
  };
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
    if (bookmarkContainerRef.current) {
      bookmarkContainerRef.current.style.display = "none";
    }
  };

  const removeOldButtonsIfExists = () => {
    if (printButtonRef.current) {
      printButtonRef.current.onclick = null;
      printButtonRef.current.remove();
    }
    if (selectButtonRef.current) {
      selectButtonRef.current.onclick = null;
      selectButtonRef.current.remove();
    }
    if (panButtonRef.current) {
      panButtonRef.current.onclick = null;
      panButtonRef.current.remove();
    }
    if (layerListButtonRef.current) {
      layerListButtonRef.current.onclick = null;
      layerListButtonRef.current.remove();
    }
    if (basemapGalleryButtonRef.current) {
      basemapGalleryButtonRef.current.onclick = null;
      basemapGalleryButtonRef.current.remove();
    }
    if (bookmarkButtonRef.current) {
      bookmarkButtonRef.current.onclick = null;
      bookmarkButtonRef.current.remove();
    }
    if (aiButtonRef.current) {
      aiButtonRef.current.onclick = null;
      aiButtonRef.current.remove();
    }
    if (menuButtonRef.current) {
      menuButtonRef.current.onclick = null;
      menuButtonRef.current.remove();
    }
    if (prevExtentButtonRef.current) {
      prevExtentButtonRef.current.onclick = null;
      prevExtentButtonRef.current.remove();
    }
    if (nextExtentButtonRef.current) {
      nextExtentButtonRef.current.onclick = null;
      nextExtentButtonRef.current.remove();
    }
    if (customButtonsContainerRef.current) {
      customButtonsContainerRef.current.onclick = null;
      customButtonsContainerRef.current.remove();
    }
  };

  // Effect to intaiting the mapview
  useEffect(() => {
    if (!utilityNetwork) return;

    //variables to store the view and the utility network
    let view;
    // let utilityNetwork;

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
        // remove old buttons that will be recreated for the new view
        removeOldButtonsIfExists();

        //craete the basemap
        const myMap = await createMap();

        let bookmarkResult;
        if (bookmarkId)
          bookmarkResult = await fetchBookmarksByIdFromDatabase(bookmarkId);

        let currentExtent;
        if (bookmarkResult) {
          const mapExtent = JSON.parse(bookmarkResult.mapExtent);
          currentExtent = mapExtent.targetGeometry;
        } else if (utilityNetwork) {
          currentExtent = utilityNetwork.fullExtent;
        } else {
          currentExtent = myExtent;
        }
        // console.log(currentExtent);
        //create the view
        const {
          view: createdView,
          customButtonsContainer,
          homeWidget,
        } = await createMapView({
          container: mapRef.current,
          map: myMap,
          extent: currentExtent,
        });
        view = createdView;

        customButtonsContainerRef.current = customButtonsContainer;

        view.when(async () => {
          const featureServiceUrl = utilityNetwork?.featureServiceUrl;

          //adding layers to the map and return them
          const result = await addLayersToMap(
            featureServiceUrl,
            view,
            !bookmarkResult
          );
          //dispatch the layers to th estore
          dispatch(setLayersAndTablesData(result.layersAndTables));

          const [layerListResult, basemapResult, printResult] =
            await Promise.all([
              createLayerList(view),
              createBasemapGallery(view),
              createPrint(view),
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
          selectButton.title = t("Select");
          selectButton.appendChild(selectImg);
          selectButton.classList.add("select-widget");

          // selectButton.onclick = () => {
          //   const isActive = selectButton.classList.contains("active");

          //   // Only deactivate if pan is active
          //   if (panButtonRef.current?.classList.contains("active")) {
          //     panButtonRef.current.classList.remove("active");
          //     selectButton.classList.add("active");
          //   } else {
          //     // Toggle select button
          //     if (isActive) {
          //       // Don't remove active class on second click
          //       return;
          //     } else {
          //       selectButton.classList.add("active");
          //     }
          //   }

          //   try {
          //     selectFeatures(
          //       view,
          //       () => store.getState().selectionReducer.selectedFeatures,
          //       dispatch,
          //       setSelectedFeatures,
          //       setActiveButton,
          //       sketchVMRef
          //     );
          //   } catch (error) {
          //     console.log("failed to select", error);
          //   }
          // };
          selectButton.onclick = () => {
            const shouldShow = toggleSelectPanActiveButton(selectButton);

            if (shouldShow) {
              try {
                selectFeatures(
                  () => store.getState().mapViewReducer.intialView,
                  () => store.getState().selectionReducer.selectedFeatures,
                  dispatch,
                  setSelectedFeatures,
                  setActiveButton,
                  () => store.getState().sidebarReducer.activeButton,
                  sketchVMRef
                );
              } catch (error) {
                console.log("failed to select", error);
              }
            } else {
              stopSketch(
                () => store.getState().mapViewReducer.intialView,
                sketchVMRef
              );
            }
          };
          const panButton = document.createElement("button");
          panButton.className = "";
          const panImg = document.createElement("img");
          panImg.src = hand;
          panImg.width = 25;
          panImg.height = 24;
          panButton.title = t("Pan");
          panButton.appendChild(panImg);

          // panButton.onclick = () => {
          //   const isActive = panButton.classList.contains("active");

          //   // Only deactivate if select is active
          //   if (selectButtonRef.current?.classList.contains("active")) {
          //     selectButtonRef.current.classList.remove("active");
          //     panButton.classList.add("active");
          //   } else {
          //     // Toggle pan button
          //     if (isActive) {
          //       // Don't remove active class on second click
          //       return;
          //     } else {
          //       panButton.classList.add("active");
          //     }
          //   }

          //   stopSketch(view, sketchVMRef);
          // };
          panButton.onclick = () => {
            const shouldShow = toggleSelectPanActiveButton(panButton);

            if (shouldShow)
              stopSketch(
                () => store.getState().mapViewReducer.intialView,
                sketchVMRef
              );
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
            const shouldShow = toggleActiveButton(printButton);
            if (printContainerRef.current) {
              hideAllWidgets();
              printContainerRef.current.style.display = shouldShow
                ? "block"
                : "none";
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
            const shouldShow = toggleActiveButton(layerListButton);
            if (layerListContainerRef.current) {
              hideAllWidgets();
              layerListContainerRef.current.style.display = shouldShow
                ? "flex"
                : "none";

              dispatch(setZIndexPanel("LayerList"));
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
            const shouldShow = toggleActiveButton(bookMarkButton);
            if (bookmarkContainerRef.current) {
              hideAllWidgets();
              bookmarkContainerRef.current.style.display = shouldShow
                ? "flex"
                : "none";

              //////////to give bookmark high zindex
              dispatch(setZIndexPanel("Bookmark"));
            }
          };

          const baseMapGalleryButton = document.createElement("button");
          const baseMapGalleryImg = document.createElement("img");
          baseMapGalleryImg.src = grid;
          baseMapGalleryImg.width = 25;
          baseMapGalleryImg.height = 24;
          baseMapGalleryButton.title = t("BaseMap");
          baseMapGalleryButton.appendChild(baseMapGalleryImg);

          baseMapGalleryButton.onclick = () => {
            const shouldShow = toggleActiveButton(baseMapGalleryButton);
            if (basemapContainerRef.current) {
              hideAllWidgets();
              basemapContainerRef.current.style.display = shouldShow
                ? "flex"
                : "none";
            }
          };

          const aiButton = document.createElement("button");
          const aiImg = document.createElement("img");
          aiImg.src = Ai;
          aiImg.width = 25;
          aiImg.height = 24;
          aiButton.title = t("GeoAI Chat");
          aiButton.appendChild(aiImg);

          aiButton.onclick = () => {
            toggleActiveButton(aiButton);
            // console.log("ai");
          };

          const menuButton = document.createElement("button");
          const menuImg = document.createElement("img");
          menuImg.src = menu;
          menuImg.width = 25;
          menuImg.height = 24;
          menuButton.title = t("Menu");
          menuButton.appendChild(menuImg);

          menuButton.onclick = () => {
            toggleActiveButton(menuButton);
            // console.log("menuButton");
          };
          // Add buttons to container
          // Save button to ref for later use
          selectButtonRef.current = selectButton;
          customButtonsContainer.appendChild(selectButton);
          panButtonRef.current = panButton;
          customButtonsContainer.appendChild(panButton);
          layerListButtonRef.current = layerListButton;
          customButtonsContainer.appendChild(layerListButton);
          const closeButton = layerListResult.container.querySelector(
            ".sidebar_widget_close"
          );
          if (closeButton) {
            closeButton.onclick = () => {
              layerListResult.container.style.display = "none";
              if (layerListButtonRef.current) {
                layerListButtonRef.current.classList.remove("active");
              }
            };
          }
          bookmarkButtonRef.current = bookMarkButton;
          customButtonsContainer.appendChild(bookMarkButton);
          printButtonRef.current = printButton;
          customButtonsContainer.appendChild(printButton);
          basemapGalleryButtonRef.current = baseMapGalleryButton;
          customButtonsContainer.appendChild(baseMapGalleryButton);
          const closeMapButton = basemapResult.container.querySelector(
            ".sidebar_widget_close"
          );
          if (closeMapButton) {
            closeMapButton.onclick = () => {
              basemapResult.container.style.display = "none";
              if (basemapContainerRef.current) {
                basemapGalleryButtonRef.current.classList.remove("active");
              }
            };
          }
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

          // Home Button
          homeWidget.on("go", () => {
            homeWidget.viewpoint = result.fullExtentViewPoint;
          });

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
            // console.log("Prev button clicked");
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
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      stopSketch(() => store.getState().mapViewReducer.intialView, sketchVMRef);
    };
  }, [utilityNetwork]);

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
      if (layerListContainerRef.current.querySelector(".title")) {
        layerListContainerRef.current.querySelector(".title").innerText =
          t("Layer List");
      }
      if (basemapContainerRef.current.querySelector(".title")) {
        basemapContainerRef.current.querySelector(".title").innerText =
          t("Basemap");
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

  // Show popup on map click
  // useEffect(() => {
  //   if (!viewSelector) return;

  //   const popupNode = popupRef.current;
  //   viewSelector.ui.add(popupNode, "manual");

  //   const clickHandler = (event) => {
  //     viewSelector.hitTest(event).then((response) => {
  //       const features = response.results
  //         .filter((r) => r.graphic && r.graphic.layer.type === "feature")
  //         .map((r) => r.graphic);

  //       if (features.length > 0) {
  //         const firstFeature = features[0];

  //         setClickedFeatures(features);
  //         setCurrentFeatureIndex(0);

  //         setCurrentFeature(firstFeature);

  //         const screenPoint = viewSelector.toScreen(event.mapPoint);
  //         if (popupNode) {
  //           popupNode.style.left = `${screenPoint.x + 10}px`;
  //           popupNode.style.top = `${screenPoint.y + 10}px`;
  //           popupNode.style.display = "block";
  //         }
  //       } else {
  //         if (popupNode) popupNode.style.display = "none";
  //         setClickedFeatures([]);
  //         setCurrentFeature(null);
  //       }
  //     });
  //   };

  //   viewSelector.on("click", clickHandler);
  // }, [viewSelector]);

  useEffect(() => {
    if (!viewSelector) return;

    const popupNode = popupRef.current;
    viewSelector.ui.add(popupNode, "manual");

    let currentMapPoint = null;

    const updatePopupPosition = () => {
      if (popupNode && currentMapPoint) {
        const screenPoint = viewSelector.toScreen(currentMapPoint);
        popupNode.style.left = `${screenPoint.x}px`;
        popupNode.style.top = `${screenPoint.y}px`;
      }
    };

    const clickHandler = async (event) => {
      const response = await viewSelector.hitTest(event);
      const features = response.results
        .filter((r) => r.graphic?.layer?.type === "feature")
        .map((r) => r.graphic);

      if (features.length > 0) {
        const firstFeature = features[0];
        setClickedFeatures(features);
        setCurrentFeatureIndex(0);
        setCurrentFeature(firstFeature);

        currentMapPoint = event.mapPoint; // Save geometry location

        if (popupNode) {
          popupNode.style.display = "block";
          updatePopupPosition(); // Initial positioning
        }
      } else {
        currentMapPoint = null;
        if (popupNode) popupNode.style.display = "none";
        setClickedFeatures([]);
        setCurrentFeature(null);
      }
    };

    // Update popup position whenever map view changes
    const extentWatch = viewSelector.watch("extent", () => {
      updatePopupPosition();
    });

    const handler = viewSelector.on("click", clickHandler);

    return () => {
      handler.remove();
      extentWatch.remove();
    };
  }, [viewSelector]);

  // effect to handle the index of the current feature to show in the popup changed
  useEffect(() => {
    if (
      clickedFeatures.length === 0 ||
      currentFeatureIndex >= clickedFeatures.length
    ) {
      return;
    }

    const feature = clickedFeatures[currentFeatureIndex];

    setCurrentFeature(feature);
  }, [currentFeatureIndex, clickedFeatures, networkService]);

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
    isNextDisabled.current =
      extentHistoryIndex.current >= extentHistory.current.length - 1;

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
        // console.log(view, "viewSelector");

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
  // useEffect(()=>{
  //   if(!viewSelector &&  !layerListContainerRef.current)return
  //   if(layerListContainerRef.current){

  //       layerListContainerRef.current.style.zIndex =
  //       zIndexPanel === "LayerList" ? "100" : "1";
  //   }

  // },[viewSelector,zIndexPanel])
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
        <div
          ref={popupRef}
          id="custom-popup"
          style={{ position: "absolute", zIndex: 999, display: "none" }}
        >
          {clickedFeatures.length > 0 && currentFeature && (
            <FeaturePopup
              feature={currentFeature}
              index={currentFeatureIndex}
              total={clickedFeatures.length}
              onPrev={() => setCurrentFeatureIndex((i) => Math.max(i - 1, 0))}
              onNext={() =>
                setCurrentFeatureIndex((i) =>
                  Math.min(i + 1, clickedFeatures.length - 1)
                )
              }
            />
          )}
        </div>

        {findContainerRef.current && (
          <Find isVisible={true} container={findContainerRef.current} />
        )}
        {mapSettingVisiblity && <MapSetting />}
        <BookMark
          containerRef={bookmarkContainerRef}
          onclose={() => {
            // console.log(bookmarkContainerRef.current.classList);
            bookmarkContainerRef.current.style.display = "none";
            bookmarkButtonRef.current.classList.remove("active");
          }}
        />
        {isConnectionVisible && <ShowConnection />}
      </div>
    </>
  );
}
