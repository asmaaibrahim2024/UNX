import { loadModules, setDefaultOptions } from "esri-loader";
import { getAssetGroupName, getAssetTypeName } from "../components/widgets/trace/traceHandler";
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
export function createMapView(options) {
  return loadModules(
    ["esri/views/MapView", "esri/widgets/Home", "esri/widgets/BasemapToggle","esri/widgets/Fullscreen"],
    { css: true }
  ).then(([MapView, Home, BasemapToggle,Fullscreen]) => {
    const view = new MapView({
      ...options,
    });
    let homeWidget = new Home({
      view: view,
      id: "homeWidget"
    });
    let basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "satellite",
    });
   let fullscreen = new Fullscreen({
      view: view
    });
    view.ui.add(fullscreen, "top-left");
    // adds the home widget to the top left corner of the MapView
    view.ui.add(homeWidget, "bottom-left");
    view.ui.move("zoom", "bottom-left");
    view.ui.add(basemapToggle, {
      position: "bottom-right",
    });
    return view;
  });
}

export function createIntl(options) {
  return loadModules(
    ["esri/intl"],
    { css: true }
  ).then(([intl]) => {
   
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
  return loadModules(["esri/layers/FeatureLayer"], {
    css: true,
  }).then(async ([FeatureLayer]) => {
    let layersAndTables = [];
    const res = await makeEsriRequest(featureServiceUrl);
    layersAndTables.push({ layers: res.layers, tables: res.tables });
    // Create an array to hold our layer promises
    const layerPromises = res.layers.map(async (l) => {
      if (l.type === "Feature Layer") {
        const layer = new FeatureLayer({
          title: l.name,
          url: `${featureServiceUrl}/${l.id}`,
          id: l.id,
          outFields: ["*"]
        });

        // Load the layer if a view is provided
        if (view?.map) {
          await layer.load();
          view.map.add(layer);
        }
        return layer;
      }
    });

    // Wait for all layers to be processed
    const layers = await Promise.all(layerPromises);

    return layersAndTables;
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

    return { layerList, container };
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



export const createGraphic = async (
  geometry,
  symbol,
  attributes
) => {
  const [Graphic] = await loadModules(["esri/Graphic"], { css: true });

  return new Graphic({
    geometry: geometry,
    symbol: symbol,
    attributes: attributes,
  });
};


const GetSymbolToHighlight = (feature) => {
  const geometryType = feature.geometry.type;

  let symbol;

  if (geometryType === "point") {
    symbol = {
      type: "simple-marker",
      style: "circle",
      color: [13, 110, 253, 0.3],
      size: 15,
      outline: {
        color: [255, 255, 255],
        width: 2,
      },
    };
  } else if (geometryType === "polyline") {
    symbol = {
      type: "simple-line",
      color: [13, 110, 253, 0.3],
      width: 4,
    };
  } else if (geometryType === "polygon") {
    symbol = {
      type: "simple-fill",
      color: [13, 110, 253, 0.3],
      outline: {
        color: [13, 110, 253],
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

  const symbol = GetSymbolToHighlight(feature);

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


export function getDomainValues(utilityNetwork, attributes, layer, layerId) {
  const formattedAttributes = {};
  
  // console.log("Old Attributes", attributes)
  
  for (const [key, value] of Object.entries(attributes)) {
    const matchingField = layer.fields.find(f => f.name.toLowerCase() === key.toLowerCase());
    const alias = matchingField?.alias || key;

    // Handle assetgroup
    if (key.toLowerCase() === "assetgroup") {
      formattedAttributes[alias] = getAssetGroupName(utilityNetwork, layerId, value);
      continue;
    }

    // Handle assettype
    if (key.toLowerCase() === "assettype") {
      const assetGroupCode = attributes["assetgroup"] ?? attributes["AssetGroup"] ?? attributes["AssetGroup".toLowerCase()];
      formattedAttributes[alias] = getAssetTypeName(utilityNetwork, layerId, assetGroupCode, value);
      continue;
    }

    if (matchingField) {

      // Handle coded-value domain
      if (matchingField.domain && matchingField.domain.type === "coded-value") {
        const codedValueEntry = matchingField.domain.codedValues.find(cv => cv.code === value);
        formattedAttributes[alias] = codedValueEntry ? codedValueEntry.name : value;
      }
      // Handle date fields
      else if (matchingField.type === "date") {
        try {
          const date = new Date(value);
          formattedAttributes[alias] = date.toLocaleDateString() + ", " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          formattedAttributes[alias] = value;
        }
      }
      // All other fields
      else {
        formattedAttributes[alias] = value;
      }

    } else {
      // If no matching field found, keep original key
      formattedAttributes[key] = value;
    }
  }
  // console.log("Formatted Attributes:", formattedAttributes);


  return formattedAttributes;


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
    ...(layersAndTablesData?.[0]?.tables || [])
  ].filter(item => item && item.id !== undefined);

  const selectedLayerOrTable = validLayersAndTables.find(layer => layer.id === layerOrTableId);
  if(selectedLayerOrTable){
    return selectedLayerOrTable.name;
  }
  return layerOrTableId; // Fallback to id if no match is found
};