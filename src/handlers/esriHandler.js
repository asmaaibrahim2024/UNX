import { loadModules, setDefaultOptions } from "esri-loader";
import { toast } from "react-hot-toast";
import { FiAlertCircle, FiInfo, FiCheckCircle } from "react-icons/fi";
import layer from "../style/images/layers-three-active.svg";
import grid from "../style/images/grid.svg";
import close from "../style/images/x-close.svg";
import {
  getAssetGroupName,
  getAssetTypeName,
} from "../components/widgets/trace/traceHandler";
import { setIsGettingSelectionData } from "../redux/widgets/selection/selectionAction";
import { interceptor } from "./authHandlers/tokenInterceptorHandler";

// Set ArcGIS JS API version to 4.28
setDefaultOptions({
  version: "4.28",
});

export function getAttributeCaseInsensitive(attributes, key) {
  const lowerKey = key.toLowerCase();
  for (const attr in attributes) {
    if (attr.toLowerCase() === lowerKey) {
      return attributes[attr];
    }
  }
  return null; // or throw error if it's required
}

/**
 * create webmap
 * @param {string} portalUrl the url of the portal
 * @param {string} portalItemId the id of the webmap on the portal
 * @returns webamp
 */
export function createWebMap(portalUrl, portalItemId, options) {
  return loadModules(["esri/WebMap", "esri/config"], { css: true }).then(
    ([WebMap, esriConfig]) => {
      if (portalUrl) {
        esriConfig.portalUrl = portalUrl;
      }
      const webMap = new WebMap({
        portalItem: {
          id: portalItemId,
        },
      });
      return webMap;
    }
  );
}

/**
 * loading Esri basemap
 * @param {object} options
 * @returns base map
 */
export function createBaseMap(options) {
  return loadModules(["esri/Basemap"], {
    css: true,
  }).then(([Basemap]) => {
    const basemap = new Basemap({
      ...options,
    });
    return basemap;
  });
}

/**
 * creating map view
 * @param {object} options
 * @returns map view
 */
// export function createMapView(options) {
//   return loadModules(
//     ["esri/views/MapView", "esri/widgets/Home", "esri/widgets/BasemapToggle","esri/widgets/Fullscreen"],
//     { css: true }
//   ).then(([MapView, Home, BasemapToggle,Fullscreen]) => {
//     const view = new MapView({
//       ...options,
//     });
//     let homeWidget = new Home({
//       view: view,
//       id: "homeWidget"
//     });
//     let basemapToggle = new BasemapToggle({
//       view: view,
//       nextBasemap: "satellite",
//     });
//    let fullscreen = new Fullscreen({
//       view: view
//     });
//     view.ui.add(fullscreen, "top-left");
//     // adds the home widget to the top left corner of the MapView
//     view.ui.add(homeWidget, "bottom-left");
//     view.ui.move("zoom", "bottom-left");
//     view.ui.add(basemapToggle, {
//       position: "bottom-right",
//     });
//     return view;
//   });
// }
export function createMapView(options) {
  return loadModules(
    [
      "esri/views/MapView",
      "esri/widgets/Home",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Fullscreen",
    ],
    { css: true }
  ).then(([MapView, Home, BasemapToggle, Fullscreen]) => {
    const view = new MapView({
      ...options,
    });

    // Add widgets
    let homeWidget = new Home({
      view: view,
      id: "homeWidget",
    });

    let basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "satellite",
    });

    let fullscreen = new Fullscreen({
      view: view,
    });

    // Add widgets to UI
    view.ui.add(fullscreen, "top-right");
    view.ui.add(homeWidget, "bottom-left");
    view.ui.move("zoom", "bottom-left");
    view.ui.add(basemapToggle, {
      position: "bottom-right",
    });

    // Create container for custom buttons
    const customButtonsContainer = document.createElement("div");
    customButtonsContainer.className = "custom-buttons-container";
    view.ui.add(customButtonsContainer, "top-right");

    return { view, customButtonsContainer, homeWidget };
  });
}
export function createIntl(options) {
  return loadModules(["esri/intl"], { css: true }).then(([intl]) => {
    return intl;
  });
}

export function createPad(view, options) {
  return loadModules(["esri/widgets/DirectionalPad"], { css: true }).then(
    ([DirectionalPad]) => {
      const container = document.createElement("div");
      container.style.display = "none"; // hidden by default
      container.className = "basemap-gallery-container";

      const directionalPad = new DirectionalPad({
        view: view,
        container: container,
        ...options,
      });

      return { directionalPad, container };
    }
  );
}

/**
 * loading Esri Map
 * @param {object} options
 * @returns esri map
 */
export function createMap(options) {
  return loadModules(["esri/Map"], {
    css: true,
  }).then(([Map]) => {
    const myMap = new Map({
      basemap: "streets-vector",
      ...options,
    });
    return myMap;
  });
}

export function createPrint(view, options) {
  return loadModules(["esri/widgets/Print"], {
    css: true,
  }).then(([Print]) => {
    const container = document.createElement("div");
    container.style.display = "none"; // hidden by default
    container.className = "print-container";
    const print = new Print({
      view: view,
      container: container,
      // specify your own print service
      printServiceUrl: window.mapConfig.services.printServiceUrl,
    });
    return { print, container };
  });
}

export function createUtilityNetwork(utilityNetworkLayerUrl, options) {
  return loadModules(["esri/networks/UtilityNetwork"], {
    css: true,
  }).then(([UtilityNetwork]) => {
    const utilityNetwork = new UtilityNetwork({
      layerUrl: utilityNetworkLayerUrl,
      ...options,
    });
    return utilityNetwork;
  });
}
export function createReactiveUtils() {
  return loadModules(["esri/core/reactiveUtils"], {
    css: true,
  }).then(([reactiveUtils]) => {
    return reactiveUtils;
  });
}

export function addLayersToMap(featureServiceUrl, view) {
  return loadModules(["esri/layers/FeatureLayer", "esri/Viewpoint"], {
    css: true,
  }).then(async ([FeatureLayer, Viewpoint]) => {
    let layersAndTables = [];
    const res = await makeEsriRequest(featureServiceUrl);
    layersAndTables.push({ layers: res.layers, tables: res.tables });

    const extents = [];
    let fullExtent;

    // Create an array to hold our layer promises
    const layerPromises = res.layers.map(async (l) => {
      if (l.type === "Feature Layer") {
        const layer = new FeatureLayer({
          title: l.name,
          url: `${featureServiceUrl}/${l.id}`,
          id: l.id,
          outFields: ["*"],
        });

        // Load the layer if a view is provided
        if (view?.map) {
          await layer.load();
          view.map.add(layer);

          // Collect extent
          // layer.when(() => {
          //   if (layer.fullExtent) extents.push(layer.fullExtent);
          // });

          // Query actual extent of the layer's features
          const result = await layer.queryExtent();
          const e = result.extent;

          // Sanity check: ignore huge or empty extents
          if (
            e &&
            e.width > 0 &&
            e.height > 0 &&
            e.width < 1e7 &&
            e.height < 1e7
          ) {
            extents.push(e);
          }
        }
        return layer;
      }
    });

    // Wait for all layers to be processed
    const layers = await Promise.all(layerPromises);

    // Union of all extents and zoom
    if (extents.length && view) {
      fullExtent = extents.reduce((acc, ext) => acc.union(ext));
      view.goTo(fullExtent);
    }

    const fullExtentViewPoint = new Viewpoint({
      targetGeometry: fullExtent,
    });

    return {
      layersAndTables: layersAndTables,
      fullExtentViewPoint: fullExtentViewPoint,
    };
  });
}

export async function defineActions(event) {
  const item = event.item;
  await item.layer.when();
  // Enable the panel for each item
  item.panel = {
    content: createSliderContent(item.layer),
    open: false,
  };
}
//!trial layerlist reorder
// export async function defineActions(event) {
//   const item = event.item;
//   await item.layer.when();

//   item.panel = {
//     content: createSliderContent(item.layer),
//     open: false,
//   };

//   // Make layer list items draggable
//   const node = event.item.panel.content.parentElement?.parentElement;
//   if (node) {
//     node.setAttribute("draggable", "true");
//     node.addEventListener("dragstart", (e) => {
//       e.dataTransfer.setData("layer-id", item.layer.id);
//     });

//     node.addEventListener("dragover", (e) => {
//       e.preventDefault();
//       node.style.borderTop = "2px solid #0079c1";
//     });

//     node.addEventListener("dragleave", () => {
//       node.style.borderTop = "";
//     });

//     node.addEventListener("drop", (e) => {
//       e.preventDefault();
//       node.style.borderTop = "";
//       const draggedLayerId = e.dataTransfer.getData("layer-id");
//       const targetLayerId = item.layer.id;

//       const map = item.layer?.view?.map || item.layer?.map;
//       if (map) {
//         const draggedLayer = map.findLayerById(draggedLayerId);
//         const targetLayer = map.findLayerById(targetLayerId);

//         if (draggedLayer && targetLayer && draggedLayer !== targetLayer) {
//           const draggedIndex = map.layers.indexOf(draggedLayer);
//           const targetIndex = map.layers.indexOf(targetLayer);
//           map.layers.reorder(draggedLayer, targetIndex);
//         }
//       }
//     });
//   }
// }
// layerList.on("list-item-moved", (event) => {
//   const movedLayer = event.item.layer;
//   const newIndex = event.newIndex;

//   // Move the layer in the map
//   view.map.reorder(movedLayer, newIndex);
// });
/////////////////////////////////////////////
function createSliderContent(layer) {
  const container = document.createElement("div");
  container.style.padding = "0.5em 1em";

  loadModules(["esri/widgets/Slider"]).then(([Slider]) => {
    const slider = new Slider({
      container: container,
      min: 0,
      max: 1,
      steps: 0.01,
      values: [layer.opacity],
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
      precision: 2,
    });

    slider.on("thumb-drag", () => {
      layer.opacity = slider.values[0];
    });
  });

  return container;
}

export function createLayerList(view) {
  return loadModules(["esri/widgets/LayerList"]).then(([LayerList]) => {
    const container = document.createElement("div");
    container.style.display = "none"; // start hidden
    container.className = "layer-list-container";
    container.classList.add("sidebar_widget");

    const header = document.createElement("div");
    header.className = "sidebar_widget_header";

    const headerTitleContainer = document.createElement("div");
    headerTitleContainer.className = "header_title_container";

    const headerImg = document.createElement("img");
    headerImg.src = layer;
    headerImg.width = 25;
    headerImg.height = 24;
    headerImg.className = "sidebar_widget_icon";

    const headerTitle = document.createElement("span");
    headerTitle.className = "title";
    headerTitle.innerText = "Layer List";

    headerTitleContainer.appendChild(headerImg);
    headerTitleContainer.appendChild(headerTitle);

    const headerClose = document.createElement("img");
    headerClose.src = close;
    headerClose.width = 25;
    headerClose.height = 24;
    headerClose.title = "close";
    headerClose.className = "sidebar_widget_close";

    //   headerClose.onclick = () =>{
    //   if (layerListButtonRef.current) {
    //   layerListButtonRef.current.classList.remove("active");
    // }
    // container.style.display = "none";
    //   }

    header.appendChild(headerTitleContainer);
    header.appendChild(headerClose);

    const sidebarWidgetBody = document.createElement("div");
    sidebarWidgetBody.className = "sidebar_widget_body";

    container.appendChild(header);
    container.appendChild(sidebarWidgetBody);

    const layerList = new LayerList({
      view: view,
      container: sidebarWidgetBody,
      listItemCreatedFunction: defineActions, // if you use actions
    });

    // layerList.when(() => {
    //   setTimeout(() => {
    //     enableLayerDragDrop(layerList, view);
    //   }, 500); // delay to allow DOM rendering
    // });
    return { layerList, container };
  });
}

export function enableLayerDragDrop(layerList, view) {
  const listItems = layerList.container.querySelectorAll(
    ".esri-layer-list__item"
  );

  listItems.forEach((itemEl, index) => {
    itemEl.setAttribute("draggable", true);
    itemEl.ondragstart = (event) => {
      event.dataTransfer.setData("text/plain", index);
    };

    itemEl.ondragover = (event) => {
      event.preventDefault();
    };

    itemEl.ondrop = (event) => {
      debugger;
      event.preventDefault();
      const draggedIndex = parseInt(event.dataTransfer.getData("text/plain"));
      const targetIndex = Array.from(listItems).indexOf(itemEl);
      console.log(
        view.map.layers.items,
        "beffffffore",
        draggedIndex,
        targetIndex,
        itemEl
      );
      const layers = view.map.layers.toArray(); // get current layer array
      const draggedLayer = layers[targetIndex];

      view.map.reorder(draggedLayer, targetIndex); // move the dragged layer to the target position
      console.log(view.map.layers.items, "aftttttttttter", draggedLayer);

      // reapply drag handlers after reorder
      setTimeout(() => {
        enableLayerDragDrop(layerList, view);
      }, 100);
    };
  });
}

export function createBasemapGallery(view, options) {
  return loadModules(["esri/widgets/BasemapGallery"]).then(
    ([BasemapGallery]) => {
      const container = document.createElement("div");
      container.style.display = "none"; // hidden by default
      container.className = "basemap-gallery-container";
      /////////////
      container.classList.add("sidebar_widget");

      const header = document.createElement("div");
      header.className = "sidebar_widget_header";

      const headerTitleContainer = document.createElement("div");
      headerTitleContainer.className = "header_title_container";

      const headerImg = document.createElement("img");
      headerImg.src = grid;
      headerImg.width = 25;
      headerImg.height = 24;
      headerImg.className = "sidebar_widget_icon";

      const headerTitle = document.createElement("span");
      headerTitle.className = "title";
      headerTitle.innerText = "Basemap";

      headerTitleContainer.appendChild(headerImg);
      headerTitleContainer.appendChild(headerTitle);

      const headerClose = document.createElement("img");
      headerClose.src = close;
      headerClose.width = 25;
      headerClose.height = 24;
      headerClose.title = "close";
      headerClose.className = "sidebar_widget_close";

      header.appendChild(headerTitleContainer);
      header.appendChild(headerClose);

      const sidebarWidgetBody = document.createElement("div");
      sidebarWidgetBody.className = "sidebar_widget_body";

      container.appendChild(header);
      container.appendChild(sidebarWidgetBody);
      ////////////

      const basemapGallery = new BasemapGallery({
        view: view,
        container: sidebarWidgetBody,
        ...options,
      });

      return { basemapGallery, container };
    }
  );
}

/**
 * Creates Esri Feature Layer using url
 * @param {string} name layer name (title)
 * @param {string} url layer url
 * @param {string} id layer id
 * @param {object} options
 * @returns featuere layer
 */
// export function createFeatureLayer(name, id, url, options) {
export function createFeatureLayer(url, options) {
  return loadModules(["esri/layers/FeatureLayer"], {
    css: true,
  }).then(([FeatureLayer]) => {
    const layer = new FeatureLayer({
      // title: name,
      url: url,
      // id: id,
      ...options,
    });
    return layer;
  });
}

/**
 * Creates BookMark Widget
 * @param {object} view the mapview
 * @param {string} domId the widget container
 * @param {array} initialBookmarks the intialbookmarks to start from db
 * @returns bookmark widget
 */
export async function initiateBookMarkWidget(view, domId, initialBookmarks) {
  try {
    const [Bookmarks] = await loadModules(["esri/widgets/Bookmarks"], {
      css: true,
    });

    const bookmarks = new Bookmarks({
      view: view,
      container: domId,
      editingEnabled: true,
      visibleElements: {
        addBookmarkButton: true,
        editBookmarkButton: true,
        time: true,
      },
    });
    const newItems = [];
    for (const bookmark of initialBookmarks) {
      const MapExtent = JSON.parse(bookmark.mapExtent);
      const bookmarkObject = await createBookMarkObject(bookmark, MapExtent);
      newItems.push(bookmarkObject);
    }
    bookmarks.bookmarks.items = [];
    bookmarks.bookmarks.items.splice(0, bookmarks.bookmarks.items.length);
    // newItems.forEach(item => {
    //   bookmarks.bookmarks.items.push(item); // Push new items individually
    // });
    bookmarks.bookmarks.items = newItems;
    return bookmarks;
  } catch (error) {
    console.error("Error loading Bookmarks module:", error);
    throw error;
  }
}

/**
 * Creates BookMark
 * @param {object} bookmark the bookmark to update
 * @param {object} MapExtent the mapextent of the view
 * @returns updated bookmark object
 */
export async function createBookMarkObject(bookmark, MapExtent) {
  try {
    const [Bookmark] = await loadModules(["esri/webmap/Bookmark"], {
      css: true,
    });
    const parsedDate = new Date(bookmark.creationDate.replace("|", ""));

    const bookmarkObject = new Bookmark({
      newid: bookmark.id,
      name: bookmark.name,
      viewpoint: MapExtent,
      thumbnail: {
        url: bookmark.mapThumbnail,
      },
      timeExtent: {
        start: parsedDate, // Use the parsed Date object here
      },
    });

    return bookmarkObject;
  } catch (error) {
    console.error("Error loading Expand module:", error);
    throw error;
  }
}

/**
 * Creates Query
 * @param {string} layerURL the layer url to query
 * @param {object} geometry optional
 * @returns features
 */
export const queryFeatureLayer = (layerURL, geometry = null) => {
  return loadModules([
    "esri/layers/FeatureLayer",
    "esri/rest/support/Query",
  ]).then(async ([FeatureLayer, Query]) => {
    var features = [];
    const layer = new FeatureLayer({
      url: layerURL,
    });
    const query = new Query({
      where: "1=1",
      outFields: ["*"],
      returnGeometry: true,
    });
    // Apply geometry filter if provided
    if (geometry) {
      query.geometry = geometry;
      query.spatialRelationship = "intersects";
    }

    await layer.queryFeatures(query).then((result) => {
      features = result.features;
    });
    return features;
  });
};

export const createGraphic = async (geometry, symbol, attributes) => {
  const [Graphic] = await loadModules(["esri/Graphic"], { css: true });

  return new Graphic({
    geometry: geometry,
    symbol: symbol,
    attributes: attributes,
  });
};

const GetSymbolToFlashHighlight = (feature) => {
  const geometryType = feature.geometry.type;

  let symbol;

  if (geometryType === "point") {
    // symbol = {
    //   type: "simple-marker",
    //   style: "circle",
    //   color: [40, 167, 69, 0.3],
    //   size: 15,
    //   outline: {
    //     color: [255, 255, 255],
    //     width: 2,
    //   },
    // };
    symbol = window.mapConfig.ZoomHighlights.pointSymbol;
  } else if (geometryType === "polyline") {
    // symbol = {
    //   type: "simple-line",
    //   color: [40, 167, 69, 0.3],
    //   width: 4,
    // };
    symbol = window.mapConfig.ZoomHighlights.polylineSymbol;
  } else if (geometryType === "polygon") {
    // symbol = {
    //   type: "simple-fill",
    //   color: [40, 167, 69, 0.3],
    //   outline: {
    //     color: [13, 110, 253],
    //     width: 1.5,
    //   },
    // };
    symbol = window.mapConfig.ZoomHighlights.polygonSymbol;
  }

  return symbol;
};

const GetSymbolToHighlight = (feature) => {
  const geometryType = feature.geometry.type;

  let symbol;

  if (geometryType === "point") {
    symbol = {
      type: "simple-marker",
      style: "circle",
      color: [61, 144, 215, 0.3],
      size: 20,
      outline: {
        width: 0,
      },
    };
  } else if (geometryType === "polyline") {
    symbol = {
      type: "simple-line",
      color: [61, 144, 215, 0.3],
      width: 4,
    };
  } else if (geometryType === "polygon") {
    symbol = {
      type: "simple-fill",
      color: [61, 144, 215, 0.3],
      outline: {
        // color: [13, 110, 253],
        width: 1.5,
      },
    };
  }

  return symbol;
};

export const highlightOrUnhighlightFeature = async (
  feature,
  removeOtherGraphics = false,

  view
) => {
  if (!feature || !view) return;

  if (removeOtherGraphics) {
    view.graphics.removeAll();
  }

  const objectid = getAttributeCaseInsensitive(feature.attributes, "objectid");
  const graphicsToRemove = view.graphics.items.filter(
    (g) => getAttributeCaseInsensitive(g.attributes, "objectid") === objectid
  );

  if (graphicsToRemove.length) {
    graphicsToRemove.forEach((g) => {
      view.graphics.remove(g);
    });
  } else {
    const symbol = GetSymbolToHighlight(feature);
    const graphic = await createGraphic(
      feature.geometry,
      symbol,
      feature.attributes
    );
    view.graphics.add(graphic);
  }
};

export const highlightFeature = async (
  feature,
  removeAllGraphics = false,
  view
) => {
  if (!feature || !view) return;

  if (removeAllGraphics) view.graphics.removeAll();

  const symbol = GetSymbolToHighlight(feature);

  const graphic = await createGraphic(
    feature.geometry,
    symbol,
    feature.attributes
  );
  view.graphics.add(graphic);
  return graphic;
};

export const flashHighlightFeature = async (
  feature,
  removeAllGraphics = false,
  view,
  flashTime
) => {
  if (!feature || !view) return;

  if (removeAllGraphics) view.graphics.removeAll();

  const symbol = GetSymbolToFlashHighlight(feature);

  const graphic = await createGraphic(
    feature.geometry,
    symbol,
    feature.attributes
  );

  view.graphics.add(graphic);

  setTimeout(() => {
    view.graphics.remove(graphic);
  }, flashTime);

  return graphic;
};

const zoomProcess = (feature, view) => {
  const geometryType = feature.geometry.type;

  if (geometryType === "point") {
    view
      .goTo({
        target: feature.geometry,
        zoom: 25, // For small point geometries
      })
      .catch(console.error);
  } else {
    view
      .goTo(feature.geometry, {
        // Add padding to avoid tight zoom
        padding: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      })
      .catch(console.error);
  }
};

export const ZoomToFeature = async (feature, view) => {
  if (!feature || !view) return;

  if (feature) {
    await flashHighlightFeature(feature, false, view, 3000);

    zoomProcess(feature, view);
  }
};

// export const makeRequest = async (url) => {
//   const [esriRequest] = await loadModules(["esri/request"], { css: true });

//   try {

//     const response = await esriRequest(url, {
//       query: { f: "json" },
//       responseType: "json",
//       });

//     return response.data;

//   } catch (error) {
//     console.error(`Failed to make request`, error);
//   }
// };

export const createGraphicsLayer = async (options) => {
  return loadModules(["esri/layers/GraphicsLayer"], {
    css: true,
  }).then(([GraphicsLayer]) => {
    const graphicsLayer = new GraphicsLayer({ ...options });
    return graphicsLayer;
  });
};

export const createSketchViewModel = async (view, selectionLayer, symbol) => {
  return loadModules(["esri/widgets/Sketch/SketchViewModel"], {
    css: true,
  }).then(([SketchViewModel]) => {
    const sketchVM = new SketchViewModel({
      view: view,
      layer: selectionLayer,
      polygonSymbol: symbol,
    });

    sketchVM.on("create", (event) => {
      if (event.state === "complete") {
        // After the first polygon is drawn, detach from editable layer and disable further editing
        sketchVM.layer = null;
        // Disable further editing
        sketchVM.update();
      }
    });

    return sketchVM;
  });
};

export const makeEsriRequest = async (url) => {
  const [esriRequest] = await loadModules(["esri/request"], { css: true });

  try {
    const response = await esriRequest(url, {
      query: { f: "json" },
      responseType: "json",
    });

    return response.data;
  } catch (error) {
    console.error("Failed to make esri request", error);
    throw error;
  }
};

// Helper to split into chunks
const chunkArray = (arr, chunkSize) => {
  const array = Array.from(arr); // Convert Set to Array

  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

/**
 * Queries a feature layer for a list of object IDs and returns the matching features.
 *
 * @param {number[]} objectIdList - An array of object IDs to query.
 * @param {string} layerUrl - The URL of the feature layer to query.
 * @returns {Promise<__esri.Graphic[]>} A promise that resolves to an array of feature graphics.
 */
export async function queryAllLayerFeatures(objectIdList, layerUrl) {
  try {
    const [Query] = await loadModules(["esri/rest/support/Query"]);

    const featureLayer = await createFeatureLayer(layerUrl, {
      outFields: ["*"],
    });

    await featureLayer.load();

    const chunks = chunkArray(objectIdList, 1000);

    // Create queries for each chunk
    const queries = chunks.map(async (chunk) => {
      const query = new Query();
      // const ids = Array.from(globalIdList)
      //   .map(id => `'${String(id).replace(/[{}]/g, "").toUpperCase()}'`)
      //   .join(", ");

      // query.where = `GLOBALID IN ( '{A2A7BD22-17A6-4A29-B76B-4695B9F00E32}', '{2100FFF4-B1CC-4B06-9FA9-0B4F10407A33}' )`;
      // query.objectIds = objectIdList;

      // query.objectIds = [...objectIdList]; //converts to array
      // query.where = `GLOBALID IN (${ids})`;
      query.objectIds = chunk;
      query.outFields = ["*"];
      query.returnGeometry = true;

      const result = await featureLayer.queryFeatures(query);
      return result.features;
    });

    // Run all queries in parallel
    const allResults = await Promise.all(queries);

    // Flatten array of arrays
    return allResults.flat();
  } catch (error) {
    console.error(`Query failed for layer ${layerUrl}:`, error);
    return [];
  }
}

export function createQueryFeatures(
  url,
  where,
  fields = ["*"],
  returnGeometry,
  options
) {
  return loadModules(["esri/rest/query"], {
    css: true,
  }).then(([query]) => {
    return query
      .executeQueryJSON(url, {
        // autocasts as new Query()
        where: where,
        outFields: fields.length ? fields : ["*"],
        returnGeometry: returnGeometry,
        ...options,
      })
      .then(
        function (results) {
          return results.features;
        },
        function (error) {
          console.log(error); // will print error in console, if any
        }
      );
  });
}

export async function createQueryFeaturesWithConditionWithGeo(
  url,
  condition,
  fields = ["*"],
  returnGeometry,
  geo
) {
  return loadModules(["esri/rest/query"], {
    css: true,
  }).then(([query]) => {
    const queryParams = {
      where: condition,
      outFields: fields.length ? fields : ["*"],
      returnGeometry: returnGeometry,
    };

    // Conditionally add geometry and spatialRelationship if geo is provided
    if (geo) {
      queryParams.geometry = geo;
      queryParams.spatialRelationship = "intersects";
    }

    return query.executeQueryJSON(url, queryParams).then(
      function (results) {
        return results.features;
      },
      function (error) {
        console.log(error); // will print error in console, if any
      }
    );
  });
}

// To get domain names
export function getDomainValues(
  utilityNetwork,
  attributes,
  layer,
  layerIdProp
) {
  const formattedAttributes = {};
  const rawKeyValues = {};
  const layerId = Number(layerIdProp);
  // console.log("Old Attributes", attributes);

  for (const [key, value] of Object.entries(attributes)) {
    const matchingField = layer.fields.find(
      (f) => f.name.toLowerCase() === key.toLowerCase()
    );
    const alias = matchingField?.alias || key;

    // Handle assetgroup
    if (key.toLowerCase() === "assetgroup") {
      formattedAttributes[alias] = getAssetGroupName(
        utilityNetwork,
        layerId,
        value
      );
      rawKeyValues[key] = getAssetGroupName(utilityNetwork, layerId, value);
      continue;
    }

    // Handle assettype
    if (key.toLowerCase() === "assettype") {
      const assetGroupCode = getAttributeCaseInsensitive(
        attributes,
        "assetgroup"
      );
      formattedAttributes[alias] = getAssetTypeName(
        utilityNetwork,
        layerId,
        assetGroupCode,
        value
      );
      rawKeyValues[key] = getAssetTypeName(
        utilityNetwork,
        layerId,
        assetGroupCode,
        value
      );
      continue;
    }

    if (matchingField) {
      // Handle coded-value domain
      if (matchingField.domain && matchingField.domain.type === "coded-value") {
        const codedValueEntry = matchingField.domain.codedValues.find(
          (cv) => cv.code === value
        );
        const displayValue = codedValueEntry ? codedValueEntry.name : value;
        formattedAttributes[alias] = displayValue;
        rawKeyValues[key] = displayValue;
      }
      // Handle date fields
      else if (matchingField.type === "date") {
        try {
          const date = new Date(value);
          const formattedDate =
            date.toLocaleDateString() +
            ", " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          formattedAttributes[alias] = formattedDate;
          rawKeyValues[key] = formattedDate;
        } catch {
          formattedAttributes[alias] = value;
          rawKeyValues[key] = value;
        }
      }
      // All other fields
      else {
        formattedAttributes[alias] = value;
        rawKeyValues[key] = value;
      }
    } else {
      // If no matching field found, keep original key
      formattedAttributes[key] = value;
      rawKeyValues[key] = value;
    }
  }
  // console.log("Formatted Attributes:", formattedAttributes);
  // console.log("Raw Key Values Attributes:", rawKeyValues);

  return {
    formattedAttributes: formattedAttributes,
    rawKeyValues: rawKeyValues,
  };
}

/**
 * Retrieves the layer name corresponding to the given `sourceId` from the `layersAndTablesData`.
 * This function searches through the domain networks, checking both junction sources and edge sources
 * to find a matching `sourceId` and returns the associated layer name. If no match is found, it returns the `sourceId` itself as a fallback.
 *
 * @param {string} sourceId - The ID of the source whose layer name is to be retrieved.
 * @returns {string} - The layer name corresponding to the `sourceId` if a match is found; otherwise, returns the `sourceId`.
 */
export function getLayerOrTableName(layersAndTablesData, layerOrTableId) {
  const validLayersAndTables = [
    ...(layersAndTablesData?.[0]?.layers || []),
    ...(layersAndTablesData?.[0]?.tables || []),
  ].filter((item) => item && item.id !== undefined);

  const selectedLayerOrTable = validLayersAndTables.find(
    (layer) => layer.id === layerOrTableId
  );
  if (selectedLayerOrTable) {
    return selectedLayerOrTable.name;
  }
  return layerOrTableId; // Fallback to id if no match is found
}

/**
 * Makes a POST request to send data.
 *
 * @param {string} apiUrl - The URL of the API.
 * @param {object} body - The body of the POST request.
 * @returns {object} - The response from the API.
 */
export const postRequest = async (apiUrl, body) => {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

/**
 * makes a get request to get data
 *
 * @param {string} apiUrl - the url of the api.
 * @returns {object} - The response of the api
 */
export const getRequest = async (apiUrl) => {
  try {
    // const response = await fetch(apiUrl);
    const response = await fetch(apiUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

/**
 * fetches the network service
 *
 * @param {number} networkServiceId - the id of the network service
 * @returns {object} - The network service data and it's network layers and it's layer fields
 */
export const fetchNetowkrService = async (networkServiceId) => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;

    const networkServiceEndpoint =
      window.mapConfig.ApiSettings.endpoints.GetNetworkServiceById;
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}${networkServiceId}`;
    const networkService = await interceptor.getRequest(networkServiceEndpoint);

    return networkService;
  } catch (e) {
    showErrorToast(`Failed to fetch network service: ${e}`);
  }
};

// Newwwww used globally
export const fetchNetworkService = async () => {
  try {
    const baseUrl = window.mapConfig.ApiSettings.baseUrl;
    const networkServiceEndpoint = "api/UtilityNetwork/GetAllNetworkServices";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await interceptor.getRequest(networkServiceEndpoint);
    if (!data) {
      throw new Error("No response data received from fetchNetworkService.");
    }
    const networkService = data[0];
    return networkService;
  } catch (error) {
    console.error("Failed to fetch network services:", error);
    showErrorToast(`Failed to fetch network service: ${error}`);
    throw error;
  }
};

export const getFilteredAttributesByFields = (attributes, fields) => {
  const allowedFields = fields.map((f) => f.toLowerCase());

  return Object.fromEntries(
    Object.entries(attributes).filter(([key]) =>
      allowedFields.includes(key.toLowerCase())
    )
  );
};

export function showErrorToast(message) {
  toast.custom(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#fff1f2",
        border: "1px solid #dc2626",
        color: "#7f1d1d",
        padding: "12px",
        borderRadius: "0.5rem",
        fontWeight: "100",
        fontSize: "0.85rem",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <FiAlertCircle size={18} color="#dc2626" />
      <span>{message}</span>
    </div>,
    { duration: 5000 }
  );
}

export function showInfoToast(message) {
  toast.custom(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#f0f7ff",
        border: "1px solid #3b82f6",
        color: "#1e40af",
        padding: "12px",
        borderRadius: "0.5rem",
        fontWeight: "100",
        fontSize: "0.85rem",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <FiInfo size={20} color="#3b82f6" />
      <span>{message}</span>
    </div>,
    { duration: 5000 }
  );
}

export function showSuccessToast(message) {
  toast.custom(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#f0fdf4", // green-50
        border: "1px solid #22c55e", // green-500
        color: "#166534", // green-800
        padding: "12px",
        borderRadius: "0.5rem",
        fontWeight: "100",
        fontSize: "0.85rem",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <FiCheckCircle size={20} color="#22c55e" />
      <span>{message}</span>
    </div>,
    { duration: 5000 }
  );
}

export const selectFeatures = async (
  view,
  getSelectedFeatures,
  dispatch,
  setSelectedFeatures,
  setActiveButton,
  sketchVMRef
) => {
  const selectionLayer = await initializeSelectionLayer(view);
  const sketchVM = await initializeSketch(view, selectionLayer);
  sketchVMRef.current = sketchVM;

  view.container.style.cursor = "crosshair";

  sketchVM.on("create", async (event) => {
    if (event.state === "complete") {
      const geometry = event.graphic.geometry;
      await handleFeatureSelection(
        geometry,
        view,
        getSelectedFeatures,
        dispatch,
        setSelectedFeatures
      );
      view.container.style.cursor = "default";
      sketchVM.cancel();
      // open the selection panel
      dispatch(setActiveButton("selection"));

      selectFeatures(
        view,
        getSelectedFeatures,
        dispatch,
        setSelectedFeatures,
        setActiveButton,
        sketchVMRef
      );
    }
  });

  sketchVM.create("polygon");
};

const initializeSelectionLayer = async (view) => {
  const selectionLayer = await createGraphicsLayer({
    id: "selectionsLayer",
    title: "Selection Graphics Layer",
  });
  selectionLayer._isSelectionLayer = true;

  await selectionLayer.load();
  view.map.add(selectionLayer);
  return selectionLayer;
};

const initializeSketch = async (view, layer) => {
  const polygonSymbol = {
    type: "simple-fill",
    color: [173, 216, 230, 0.2],
    outline: {
      color: [70, 130, 180],
      width: 2,
    },
  };

  const sketchVM = await createSketchViewModel(view, layer, polygonSymbol);

  return sketchVM;
};

const handleFeatureSelection = async (
  geometry,
  view,
  getSelectedFeatures,
  dispatch,
  setSelectedFeatures
) => {
  try {
    dispatch(setIsGettingSelectionData(true));
    const layers = getQueryableFeatureLayers(view);

    if (!layers.length) {
      console.warn("No feature layers found.");
      return;
    }

    let newFeatures = [];
    const currentSelected = [...getSelectedFeatures()];

    for (const layer of layers) {
      const features = await queryFeaturesByGeometry(layer, geometry);

      if (features.length) {
        const updatedFeatures = await mergeFeaturesForLayer(
          layer,
          features,
          currentSelected
        );

        newFeatures.push(updatedFeatures);
        highlightFeatures(view, features);
      }
    }

    const allFeatures = combineWithOtherSelections(
      newFeatures,
      currentSelected
    );

    await addLayerToFeatures(allFeatures);

    dispatch(setSelectedFeatures(allFeatures));
    dispatch(setIsGettingSelectionData(false));
  } catch (error) {
    console.error("Error selecting features:", error);
    if (error.details) {
      console.error("Detailed Error Info:", error.details);
    }
  }
};

const getQueryableFeatureLayers = (view) => {
  return view.map.allLayers.items.filter(
    (layer) =>
      layer.visible && layer.type === "feature" && layer.capabilities?.query
  );
};

const queryFeaturesByGeometry = async (layer, geometry) => {
  try {
    return await createQueryFeaturesWithConditionWithGeo(
      layer.parsedUrl.path,
      "1=1",
      layer.outFields?.length ? layer.outFields : ["*"],
      true,
      geometry
    );
  } catch (e) {
    console.warn(`Failed querying layer ${layer.title}:`, e);
    return [];
  }
};

const addLayerToFeatures = async (currentSelected) => {
  currentSelected.map((element) =>
    element.features.map((feature) => (feature.layer = element.layer))
  );
};

const mergeFeaturesForLayer = async (layer, features, currentSelected) => {
  const existingIndex = currentSelected.findIndex((item) => {
    return item.layer.title === layer.title;
  });

  if (existingIndex >= 0) {
    const existing = currentSelected[existingIndex].features;
    const merged = [
      ...existing,
      ...features.filter(
        (newF) =>
          !existing.some(
            (existingF) =>
              getAttributeCaseInsensitive(existingF.attributes, "objectid") ===
              getAttributeCaseInsensitive(newF.attributes, "objectid")
          )
      ),
    ];

    return { layer: await layer.load(), features: merged };
  } else {
    return { layer: await layer.load(), features: features };
  }
};

const combineWithOtherSelections = (newSelections, currentSelections) => {
  const untouchedSelections = currentSelections.filter(
    (item) =>
      !newSelections.some((newItem) => newItem.layerName === item.layerName)
  );

  return [...untouchedSelections, ...newSelections];
};

const highlightFeatures = (view, features) => {
  features.forEach((feature) => {
    highlightOrUnhighlightFeature(feature, false, view);
  });
};

export const removeSingleFeatureFromSelection = (
  selectedFeatures,
  layerTitle,
  objectId,
  dispatch,
  setSelectedFeatures,
  view
) => {
  let deletedFeature = null;

  const updatedSelection = selectedFeatures
    .map((layer) => {
      if (layer.layer.title === layerTitle) {
        const filteredFeatures = layer.features.filter(
          (f) =>
            getAttributeCaseInsensitive(f.attributes, "objectid") != objectId
        );

        deletedFeature = layer.features.find(
          (f) =>
            getAttributeCaseInsensitive(f.attributes, "objectid") === objectId
        );

        return filteredFeatures.length > 0
          ? { ...layer, features: filteredFeatures }
          : null;
      }
      return layer;
    })
    .filter(Boolean); // Remove null entries

  if (deletedFeature) {
    dispatch(setSelectedFeatures(updatedSelection));
    highlightOrUnhighlightFeature(deletedFeature, false, view);
  }
};

export const removeMultipleFeatureFromSelection = (
  selectedFeatures,
  layerTitle,
  objectIds,
  dispatch,
  setSelectedFeatures,
  view
) => {
  let deletedFeatures = [];

  const updatedSelection = selectedFeatures
    .map((layer) => {
      if (layer.layer.title === layerTitle) {
        const remainingFeatures = layer.features.filter((f) => {
          const objectId = getAttributeCaseInsensitive(
            f.attributes,
            "objectid"
          );

          const toRemove = objectIds.includes(objectId);
          if (toRemove) {
            deletedFeatures.push(f);
          }
          return !toRemove;
        });

        return remainingFeatures.length > 0
          ? { ...layer, features: remainingFeatures }
          : null;
      }

      return layer;
    })
    .filter(Boolean); // Remove null entries

  if (deletedFeatures.length > 0) {
    dispatch(setSelectedFeatures(updatedSelection));
    deletedFeatures.forEach((feature) => {
      highlightOrUnhighlightFeature(feature, false, view);
    });
  }
};

export const addSingleFeatureToSelection = async (
  feature,
  layer,
  view,
  getSelectedFeatures,
  dispatch,
  setSelectedFeatures
) => {
  try {
    const currentSelected = [...getSelectedFeatures()];
    await layer.load();

    const updatedSelection = updateLayerSelection(
      currentSelected,
      layer,
      feature
    );
    highlightOrUnhighlightFeature(feature, false, view);

    ZoomToFeature(feature, view);

    dispatch(setSelectedFeatures(updatedSelection));
  } catch (error) {
    console.error("Failed to add single feature:", error);
  }
};

const updateLayerSelection = (currentSelections, layer, feature) => {
  const existingIndex = currentSelections.findIndex(
    (item) => item.layer.title === layer.title
  );

  if (existingIndex >= 0) {
    const existingFeatures = currentSelections[existingIndex].features;

    if (!isFeatureAlreadySelected(existingFeatures, feature)) {
      existingFeatures.push(feature);
    }

    currentSelections[existingIndex] = {
      layer,
      features: existingFeatures,
    };
  } else {
    currentSelections.push({
      layer,
      features: [feature],
    });
  }

  return currentSelections;
};

export const isFeatureAlreadySelected = (features, newFeature) => {
  return features.some(
    (f) =>
      getAttributeCaseInsensitive(f.attributes, "objectid") ===
      getAttributeCaseInsensitive(newFeature.attributes, "objectid")
  );
};

export const getSelectedFeaturesCount = (selectedFeatures) => {
  const totalCount = selectedFeatures.reduce(
    (sum, layer) => sum + layer.features.length,
    0
  );

  return totalCount;
};

export const stopSketch = (view, sketchVMRef) => {
  if (sketchVMRef.current) {
    sketchVMRef.current.cancel();
    sketchVMRef.current.destroy();
    sketchVMRef.current = null;
    if (view?.container?.style) {
      view.container.style.cursor = "default";
    }
  }
};

export const closeFindPanel = (
  dispatch,
  setShowSidebar,
  setDisplaySearchResults
) => {
  dispatch(setShowSidebar(false));
  dispatch(setDisplaySearchResults(false));
};

export const getListDetailsAttributes = (
  feature,
  layer,
  networkLayers,
  utilityNetwork
) => {
  const attributes = feature.attributes;
  const SelectedNetworklayer = networkLayers.find(
    (nl) => nl.layerId == Number(layer.layerId)
  );

  if (!SelectedNetworklayer) return "";

  const listDetailsFields = SelectedNetworklayer.layerFields
    .filter((lf) => lf.isListDetails === true)
    .map((lf) => lf.dbFieldName.toLowerCase()); // Normalize field names

  // Filter attributes to only include listDetailsFields
  const filteredAttributes = getFilteredAttributesByFields(
    attributes,
    listDetailsFields
  );

  const filteredAttributessWithoutObjectId = Object.fromEntries(
    Object.entries(filteredAttributes).filter(
      ([key]) => key.toLowerCase() !== "objectid"
    )
  );
  const featureWithDomainValues = getDomainValues(
    utilityNetwork,
    filteredAttributessWithoutObjectId,
    layer,
    Number(layer.layerId)
  ).formattedAttributes;

  return featureWithDomainValues;
  // return Object.entries(featureWithDomainValues).map(([key, value]) => (
  //   <span className="name">{String(value)}</span>
  // ));
};

export const renderListDetailsAttributesToJSX = (
  feature,
  layer,
  networkLayers,
  utilityNetwork
) => {
  const featureWithDomainValues = getListDetailsAttributes(
    feature,
    layer,
    networkLayers,
    utilityNetwork
  );

  return Object.entries(featureWithDomainValues).map(([key, value]) => (
    <span className="name">{String(value)}</span>
  ));
};

export const handleRemoveTracePoint = async (
  globalId,
  traceGraphicsLayer,
  dispatch,
  removeTracePoint
) => {
  const percentAlong = 0;
  const fullId = `${globalId}-${percentAlong}`;
  dispatch(removeTracePoint(fullId));
  // Remove point graphic from map
  const graphicToRemove = traceGraphicsLayer.graphics.find(
    (g) => g.attributes?.id === fullId
  );
  console.log(graphicToRemove);
  if (graphicToRemove) {
    traceGraphicsLayer.graphics.remove(graphicToRemove);
  }
};

export const removeMultipleTracePoint = async (
  globalIds,
  traceGraphicsLayer,
  dispatch,
  removeTracePoint
) => {
  globalIds.forEach((globalId) => {
    console.log(globalId);
    handleRemoveTracePoint(
      globalId,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint
    );
  });
};

export const addOrRemoveTraceStartPoint = async (
  feature,
  SelectedTracePoint,
  traceGraphicsLayer,
  dispatch,
  removeTracePoint,
  getSelectedPointTerminalId,
  addPointToTrace,
  utilityNetwork,
  selectedPoints,
  tTrace
) => {
  const type = "startingPoint";
  const globalId = getAttributeCaseInsensitive(feature.attributes, "globalid");
  const assetGroup = getAttributeCaseInsensitive(
    feature.attributes,
    "assetgroup"
  );
  const assetType = getAttributeCaseInsensitive(
    feature.attributes,
    "assettype"
  );

  if (!assetGroup) {
    showErrorToast(
      "Cannot add point: The selected point does not belong to any asset group."
    );
    return;
  }
  if (isStartingPoint(globalId, selectedPoints)) {
    handleRemoveTracePoint(
      globalId,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint
    );
  } else {
    // Get terminal id for device/junction features
    const terminalId = getSelectedPointTerminalId(
      utilityNetwork,
      Number(feature.layer.layerId),
      assetGroup,
      assetType
    );

    const selectedTracePoint = new SelectedTracePoint(
      type,
      globalId,
      Number(feature.layer.layerId),
      assetGroup,
      assetType,
      terminalId,
      0 // percentAlong
    );
    console.log(feature);
    let featureGeometry = feature.geometry;
    // If it's a line (polyline), take its first point
    if (featureGeometry.type === "polyline") {
      const firstPath = featureGeometry.paths[0]; // first path (array of points)
      const firstPoint = firstPath[0]; // first point in that path

      featureGeometry = {
        type: "point",
        x: firstPoint[0],
        y: firstPoint[1],
        spatialReference: featureGeometry.spatialReference,
      };
    }
    addPointToTrace(
      utilityNetwork,
      selectedPoints,
      selectedTracePoint,
      featureGeometry,
      traceGraphicsLayer,
      dispatch,
      tTrace
    );
  }
};

export const isStartingPoint = (globalId, selectedPoints) => {
  if (!selectedPoints?.StartingPoints) return false;

  const selectedpoint = selectedPoints.StartingPoints.find(
    (point) => point[1] === globalId
  );
  return selectedpoint !== undefined;
};

export const addOrRemoveBarrierPoint = (
  feature,
  SelectedTracePoint,
  traceGraphicsLayer,
  dispatch,
  removeTracePoint,
  getSelectedPointTerminalId,
  addPointToTrace,
  utilityNetwork,
  selectedPoints,
  tTrace
) => {
  const type = "barrier";
  const globalId = getAttributeCaseInsensitive(feature.attributes, "globalid");

  const assetGroup = getAttributeCaseInsensitive(
    feature.attributes,
    "assetgroup"
  );
  const assetType = getAttributeCaseInsensitive(
    feature.attributes,
    "assettype"
  );

  if (!assetGroup) return;
  if (isBarrierPoint(globalId, selectedPoints)) {
    handleRemoveTracePoint(
      globalId,
      traceGraphicsLayer,
      dispatch,
      removeTracePoint
    );
  } else {
    // Get terminal id for device/junction features
    const terminalId = getSelectedPointTerminalId(
      utilityNetwork,
      Number(feature.layer.layerId),
      assetGroup,
      assetType
    );

    const selectedTracePoint = new SelectedTracePoint(
      type,
      globalId,
      Number(feature.layer.layerId),
      assetGroup,
      assetType,
      terminalId,
      0 // percentAlong
    );

    let featureGeometry = feature.geometry;
    // If it's a line (polyline), take its first point
    if (featureGeometry.type === "polyline") {
      const firstPath = featureGeometry.paths[0]; // first path (array of points)
      const firstPoint = firstPath[0]; // first point in that path

      featureGeometry = {
        type: "point",
        x: firstPoint[0],
        y: firstPoint[1],
        spatialReference: featureGeometry.spatialReference,
      };
    }
    addPointToTrace(
      utilityNetwork,
      selectedPoints,
      selectedTracePoint,
      featureGeometry,
      traceGraphicsLayer,
      dispatch,
      tTrace
    );
  }
};

export const isBarrierPoint = (globalId, selectedPoints) => {
  if (!selectedPoints?.Barriers) return false;

  const selectedpoint = selectedPoints.Barriers.find(
    (point) => point[1] === globalId
  );
  return selectedpoint !== undefined;
};

export const addOrRemoveFeatureFromSelection = async (
  objectId,
  feature,
  currentSelectedFeatures,
  layerTitle,
  dispatch,
  setSelectedFeatures,
  view,
  getSelectedFeatures
) => {
  // const featureAttributes = feature.attributes;
  const matchingFeatures = getSelectedFeaturesForLayer(
    currentSelectedFeatures,
    feature
  );

  if (isFeatureAlreadySelected(matchingFeatures, feature)) {
    // Feature exists - remove it
    return removeSingleFeatureFromSelection(
      currentSelectedFeatures,
      layerTitle,
      objectId,
      dispatch,
      setSelectedFeatures,
      view
    );
  } else {
    // Feature doesn't exist - add it
    return await addSingleFeatureToSelection(
      feature,
      feature.layer,
      view,
      getSelectedFeatures,
      dispatch,
      setSelectedFeatures
    );
  }
};

export const getSelectedFeaturesForLayer = (
  currentSelectedFeatures,
  feature
) => {
  return (
    currentSelectedFeatures.find((selectedfeature) => {
      return (
        Number(selectedfeature.layer.layerId) === Number(feature.layer.layerId)
      );
    })?.features || []
  );
};
export function addProxyRules(options) {
  // debugger
  if (!window.appConfig.httpProxy.useProxy) {
    return;
  }
  loadModules(["esri/core/urlUtils", "esri/config"]).then(
    ([urlUtils, esriConfig]) => {
      esriConfig.request.interceptors.push({ before: esriRequestInterceptor });
      options.forEach((rule) => urlUtils.addProxyRule(rule));
    }
  );
}
export function esriRequestInterceptor(ioArgs) {
  // debugger
  if (
    ioArgs.url
      .toLowerCase()
      .includes(window.appConfig.httpProxy.arcgisDomainServer.toLowerCase())
  ) {
    ioArgs.requestOptions.headers = ioArgs.headers || {};
    ioArgs.requestOptions.headers.Authorization =
      "Bearer " + sessionStorage.getItem("token")
        ? sessionStorage.getItem("token")
        : null;
    ioArgs.requestOptions.query = ioArgs.requestOptions.query || {};
  }
}

export const mergeNetworkLayersWithNetworkLayersCache = (
  networkLayers,
  networkLayersCache
) => {
  return networkLayers.map((layer) => {
    const cachedLayer = networkLayersCache[layer.layerId];
    return cachedLayer ? cachedLayer : layer;
  });
};

export const getFieldNameFromDbAndValueFromAttributes = (
  layerFields,
  attributes,
  i18n
) => {
  const attributesWithSelectedLanguage = {};
  // loop to get the key from layerFields and the value from rawKeyValues
  for (const [dbFieldName, value] of Object.entries(attributes)) {
    const field = layerFields.find((lf) => lf.dbFieldName === dbFieldName);
    if (!field) {
      const key = dbFieldName;
      attributesWithSelectedLanguage[key] = value;
      continue;
    }
    const key = i18n.language === "en" ? field.fieldNameEN : field.fieldNameAR;
    attributesWithSelectedLanguage[key] = value;
  }
  return attributesWithSelectedLanguage;
};

export const displayNetworkDiagramHelper = async (
  diagramMap,
  token,
  view,
  networkObj
) => {
  return loadModules(
    [
      "esri/identity/IdentityManager",
      "esri/layers/MapImageLayer",
      "esri/geometry/Point",
    ],
    {
      css: true,
    }
  ).then(([IdentityManager, MapImageLayer, Point]) => {
    debugger;
    IdentityManager.registerToken({ server: diagramMap, token: token });
    // Remove previous diagram layers if needed
    view.map.layers.forEach((layer) => {
      if (layer.title === "Network Diagram") {
        view.map.remove(layer);
      }
    });
    let layer = new MapImageLayer({
      url: diagramMap,
      title: "Network Diagram",
    });
    view.map.add(layer);
    console.log(layer, "layerlayer");

    let extentFactor = 1;
    let dgExtent = networkObj.diagramExtent;
    view.spatialReference = dgExtent.spatialReference;
    let point = new Point(
      (dgExtent.xmin + dgExtent.xmax) / 2,
      (dgExtent.ymin + dgExtent.ymax) / 2
    );
    point.spatialReference = dgExtent.spatialReference;
    view.center = point.clone();
    view.extent = dgExtent;
    let extent2 = view.extent.clone();
    view.extent = extent2.expand(2 + extentFactor * 0.00001);
    extentFactor = extentFactor + 1; //The extent change everytime we call display diagram,
    return layer.url;

    //because there is a strange issue : after an applylayout the display cache seems to be keep for known extent
  });
};

export const getFeatureLayers = async (layersIds, networkLayers, options) => {
  const promises = layersIds.map(async (id) => {
    const featureServerUrl = networkLayers.find(
      (l) => l.layerId === id
    )?.layerUrl;

    if (!featureServerUrl) return null;

    const featureLayerUrl = `${featureServerUrl}/${id}`;
    const featureLayer = await createFeatureLayer(
      featureLayerUrl,
      options
      //   {
      //   outFields: ["*"],
      // }
    );

    await featureLayer.load();
    return featureLayer;
  });

  const featureLayers = (await Promise.all(promises)).filter(Boolean); // remove nulls
  return featureLayers;
};

export const isValidDate = (input) => {
  const parsedDate = new Date(input);

  return !isNaN(parsedDate.getTime());
};

export const QueryAssociationsForOneFeature = async (
  associationTypes,
  utilityNetwork,
  feature,
  getSelectedPointTerminalId
) => {
  const networkSourceId = await getNetworkSourceId(utilityNetwork, feature);

  const terminalId = getSelectedPointTerminalId(
    utilityNetwork,
    feature.layer.layerId,
    getAttributeCaseInsensitive(feature.attributes, "assetgroup"),
    getAttributeCaseInsensitive(feature.attributes, "assettype")
  );
  const element = {
    globalId: getAttributeCaseInsensitive(feature.attributes, "globalid"),
    objectId: getAttributeCaseInsensitive(feature.attributes, "objectid"),
    networkSourceId: networkSourceId,
    terminalId: terminalId,
    assetGroupCode: getAttributeCaseInsensitive(
      feature.attributes,
      "assetgroup"
    ),
    assetTypeCode: getAttributeCaseInsensitive(feature.attributes, "assettype"),
  };

  const associations = await utilityNetwork.queryAssociations({
    types: associationTypes,
    elements: [element],
  });

  return associations;
};

export const getNetworkSourceId = async (utilityNetwork, feature) => {
  const mapping = {};

  const domainNetworks = utilityNetwork.dataElement.domainNetworks;
  let networkSourceId;
  domainNetworks.forEach((network) => {
    [...network.edgeSources, ...network.junctionSources].forEach((source) => {
      mapping[source.sourceId] = source.layerId;

      if (source.layerId === feature.layer.layerId)
        networkSourceId = source.sourceId;
    });
  });

  return networkSourceId;
};

export const getConnectivityNodes = async (
  associationTypes,
  utilityNetwork,
  feature,
  getSelectedPointTerminalId,
  networkLayers
) => {
  const featureGlobalId = getAttributeCaseInsensitive(
    feature.attributes,
    "globalid"
  );

  const associations = await QueryAssociationsForOneFeature(
    associationTypes,
    utilityNetwork,
    feature,
    getSelectedPointTerminalId
  );

  const rootAssociations = filterAssociationsByFromGlobalId(
    associations,
    featureGlobalId
  );

  const globalIdMap = {};
  const children = await buildTree(
    rootAssociations,
    associationTypes,
    utilityNetwork,
    globalIdMap
  );

  const globalIdToAssetGroupMap = await queryAssetGroupsForTree(
    globalIdMap,
    utilityNetwork,
    networkLayers
  );

  replaceLabelsWithAssetGroup(children, globalIdToAssetGroupMap);

  const rootAttributes = getDomainValues(
    utilityNetwork,
    feature.attributes,
    feature.layer,
    Number(feature.layer.layerId)
  ).rawKeyValues;

  return [
    {
      label: getAttributeCaseInsensitive(rootAttributes, "assetgroup"),
      expanded: true,
      children,
    },
  ];
};

export const filterAssociationsByFromGlobalId = (
  associations,
  fromGlobalId
) => {
  return associations.filter(
    (assoc) => assoc.fromNetworkElement.globalId === fromGlobalId
  );
};

export const filterAssociationsByToGlobalId = (associations, toGlobalId) => {
  return associations.filter(
    (assoc) => assoc.toNetworkElement.globalId === toGlobalId
  );
};

const buildTree = async (
  associations,
  associationTypes,
  utilityNetwork,
  globalIdMap
) => {
  return Promise.all(
    associations.map((association) =>
      buildNode(
        association.toNetworkElement,
        associationTypes,
        utilityNetwork,
        globalIdMap
      )
    )
  );
};

const buildNode = async (
  element,
  associationTypes,
  utilityNetwork,
  globalIdMap
) => {
  // 👉 Group the globalId under the corresponding networkSourceId
  const nsId = element.networkSourceId;
  const gid = element.globalId;

  if (!globalIdMap[nsId]) {
    globalIdMap[nsId] = [];
  }
  globalIdMap[nsId].push(gid);

  const associations = await QueryAssociationsForOneElement(
    associationTypes,
    utilityNetwork,
    element
  );

  const nextAssociations = associations.filter(
    (assoc) => assoc.fromNetworkElement.globalId === element.globalId
  );

  const children = await Promise.all(
    nextAssociations.map((association) =>
      buildNode(
        association.toNetworkElement,
        associationTypes,
        utilityNetwork,
        globalIdMap
      )
    )
  );

  return {
    label: gid,
    expanded: false,
    children,
  };
};

const queryAssetGroupsForTree = async (
  globalIdMap,
  utilityNetwork,
  networkLayers
) => {
  const globalIdToAssetGroupMap = new Map();
  const networkSourcesIdsToLayersIdsMap =
    await getLayerIdMappedByNetworkSourceId(utilityNetwork);

  const layersIds = Object.keys(globalIdMap).map(
    (id) => networkSourcesIdsToLayersIdsMap[id]
  );

  const featurelayers = await getFeatureLayers(layersIds, networkLayers, {
    outFields: ["assetgroup", "globalid", "objectid"],
  });

  for (const [networkSourceId, globalIds] of Object.entries(globalIdMap)) {
    const whereClause = await buildWhereClauseForListOfGlobalIds(globalIds);
    const layerId = networkSourcesIdsToLayersIdsMap[networkSourceId];
    const currentFeatureLayer = featurelayers.find(
      (fl) => fl.layerId === layerId
    );

    const queryResult = await currentFeatureLayer.queryFeatures({
      where: whereClause,
      outFields: ["globalid", "assetgroup"],
      returnGeometry: false,
    });

    for (const f of queryResult.features) {
      const globalId = getAttributeCaseInsensitive(f.attributes, "globalid");

      const attributesWithDomainValues = getDomainValues(
        utilityNetwork,
        f.attributes,
        f.layer,
        Number(f.layer.layerId)
      ).rawKeyValues;

      const assetGroup = getAttributeCaseInsensitive(
        attributesWithDomainValues,
        "assetgroup"
      );

      globalIdToAssetGroupMap.set(globalId, assetGroup);
    }
  }

  return globalIdToAssetGroupMap;
};

const replaceLabelsWithAssetGroup = (nodes, globalIdToAssetGroupMap) => {
  for (const node of nodes) {
    if (globalIdToAssetGroupMap.has(node.label)) {
      node.label = globalIdToAssetGroupMap.get(node.label);
    }
    if (node.children?.length) {
      replaceLabelsWithAssetGroup(node.children, globalIdToAssetGroupMap);
    }
  }
};

export const buildWhereClauseForListOfGlobalIds = async (globalIds) => {
  let where = [];
  globalIds.map((globalId) => {
    const currentWhere = ` globalId = '${globalId}' `;
    where.push(currentWhere);
  });

  return where.join("OR");
};

const QueryAssociationsForOneElement = async (
  associationTypes,
  utilityNetwork,
  element
) => {
  const associations = await utilityNetwork.queryAssociations({
    elements: [element],
    associationTypes: associationTypes,
  });

  return associations;
};

export const getLayerIdMappedByNetworkSourceId = async (utilityNetwork) => {
  const mapping = {};

  const domainNetworks = utilityNetwork.dataElement.domainNetworks;

  domainNetworks.forEach((network) => {
    [...network.edgeSources, ...network.junctionSources].forEach((source) => {
      mapping[source.sourceId] = source.layerId;
    });
  });

  return mapping;
};

export const addTablesToNetworkLayers = (tables, networkLayers) => {
  tables.map((table) => {
    const layerUrlArr = networkLayers[0].layerUrl.split("/");
    layerUrlArr.pop();
    layerUrlArr.push(table.id);
    const layerUrl = layerUrlArr.join("/");

    networkLayers.push({
      layerId: table.id,
      layerUrl: layerUrl,
    });
  });
};

export const getAssociationStatusValue = (utilityNetwork, feature) => {
  const associationStatusCodeObject = {};
  associationStatusCodeObject.associationStatus = getAttributeCaseInsensitive(
    feature.attributes,
    "associationstatus"
  );

  const associationStatusValue = getDomainValues(
    utilityNetwork,
    associationStatusCodeObject,
    feature.layer,
    Number(feature.layer.layerId)
  ).rawKeyValues.associationStatus;

  return associationStatusValue;
};

export const getAssociationsitems = async (
  associationTypes,
  utilityNetwork,
  feature,
  getSelectedPointTerminalId,
  networkLayers
) => {
  const featureGlobalId = getAttributeCaseInsensitive(
    feature.attributes,
    "globalid"
  );

  const associations = await QueryAssociationsForOneFeature(
    associationTypes,
    utilityNetwork,
    feature,
    getSelectedPointTerminalId
  );

  const globalIdMap = await getGlobalIdMap(associations, featureGlobalId);

  const items = await queryFeaturesForAssociations(
    globalIdMap,
    utilityNetwork,
    networkLayers
  );

  return items;
};

const getGlobalIdMap = async (associations, featureGlobalId) => {
  const globalIdMap = {};
  await Promise.all(
    associations.map((association) => {
      let networkSourceId;
      let globalId;
      // if the feature is at from get the data from the to and vice versa
      if (association.toNetworkElement.globalId === featureGlobalId) {
        networkSourceId = association.fromNetworkElement.networkSourceId;
        globalId = association.fromNetworkElement.globalId;
      } else {
        networkSourceId = association.toNetworkElement.networkSourceId;
        globalId = association.toNetworkElement.globalId;
      }

      if (!globalIdMap[networkSourceId]) {
        globalIdMap[networkSourceId] = [];
      }
      globalIdMap[networkSourceId].push(globalId);
    })
  );
  return globalIdMap;
};

const queryFeaturesForAssociations = async (
  globalIdMap,
  utilityNetwork,
  networkLayers
) => {
  const items = [];
  const networkSourcesIdsToLayersIdsMap =
    await getLayerIdMappedByNetworkSourceId(utilityNetwork);

  const layersIds = Object.keys(globalIdMap).map(
    (id) => networkSourcesIdsToLayersIdsMap[id]
  );

  const featurelayers = await getFeatureLayers(layersIds, networkLayers, {
    outFields: ["assetgroup", "globalid", "objectid"],
  });

  for (const [networkSourceId, globalIds] of Object.entries(globalIdMap)) {
    const whereClause = await buildWhereClauseForListOfGlobalIds(globalIds);
    const layerId = networkSourcesIdsToLayersIdsMap[networkSourceId];
    const currentFeatureLayer = featurelayers.find(
      (fl) => fl.layerId === layerId
    );

    const queryResult = await currentFeatureLayer.queryFeatures({
      where: whereClause,
      outFields: ["*"],
      returnGeometry: true,
    });
    console.log(queryResult);
    for (const f of queryResult.features) {
      items.push(f);
    }
  }

  return items;
};
