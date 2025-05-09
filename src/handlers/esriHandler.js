import { loadModules, setDefaultOptions } from "esri-loader";
import { toast } from "react-hot-toast";
import { FiAlertCircle, FiInfo, FiCheckCircle } from "react-icons/fi";
import {
  getAssetGroupName,
  getAssetTypeName,
} from "../components/widgets/trace/traceHandler";
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

    const layerList = new LayerList({
      view: view,
      container: container,
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

      const basemapGallery = new BasemapGallery({
        view: view,
        container: container,
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
 * makes a get request to get data
 *
 * @param {string} apiUrl - the url of the api.
 * @returns {object} - The response of the api
 */
export const getRequest = async (apiUrl) => {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

/**
 * fetches the network service
 *
 * @param {number} networkServiceId - the id of the network service
 * @returns {object} - The network service data and it's network layers and it's layer fields
 */
export const fetchNetowkrService = async (networkServiceId) => {
  const baseUrl = window.mapConfig.ApiSettings.baseUrl;

  const networkServiceEndpoint =
    window.mapConfig.ApiSettings.endpoints.GetNetworkServiceById;
  const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}${networkServiceId}`;
  const networkService = await getRequest(networkServiceUrl);

  return networkService;
};

// Newwwww used globally
export const fetchNetworkService = async () => {
  try {
    const baseUrl = "https://localhost:7002/";
    const networkServiceEndpoint = "api/UtilityNetwork/GetAllNetworkServices";
    const networkServiceUrl = `${baseUrl}${networkServiceEndpoint}`;
    const data = await getRequest(networkServiceUrl);
    const networkService = data[0];
    return networkService;
  } catch (error) {
    console.error("Failed to fetch network services:", error);
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
  const selectionLayer = await createGraphicsLayer();
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

    dispatch(setSelectedFeatures(allFeatures));
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
