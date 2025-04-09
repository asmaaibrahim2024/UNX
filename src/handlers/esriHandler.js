import { loadModules, setDefaultOptions } from "esri-loader";
 
// Set ArcGIS JS API version to 4.28
setDefaultOptions({
  version: "4.28"
});
 
/**
 * create webmap
 * @param {string} portalUrl the url of the portal
 * @param {string} portalItemId the id of the webmap on the portal
 * @returns webamp
 */
export function createWebMap(portalUrl,portalItemId,options) {
  return loadModules(["esri/WebMap", "esri/config"], { css: true })
      .then(([WebMap, esriConfig]) => {
          if (portalUrl) {
              esriConfig.portalUrl = portalUrl
          }
          const webMap = new WebMap({
              portalItem: {
                  id: portalItemId
              },
          });
          return webMap;
      });
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
    return loadModules(["esri/views/MapView"], {css: true,})
        .then(([MapView]) => {
            const view = new MapView({
                ...options,
            });
            return view;
        });
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

export function createUtilityNetwork(utilityNetworkLayerUrl,options) {
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

export function addLayersToMap(featureServiceUrl,view, options) {
  return loadModules(["esri/layers/FeatureLayer"], {
    css: true,
  }).then(async ([FeatureLayer]) => {
  const res= await loadFeatureLayers(featureServiceUrl)
 // Create an array to hold our layer promises
 const layerPromises = res.layers.map(async (l) => {
  if(l.type == "Feature Layer"){

    const layer = new FeatureLayer({
      title: l.name,
      url: `${featureServiceUrl}/${l.id}`,
      id: l.id
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

console.log("Successfully loaded layers:", layers); // Return the array of FeatureLayer instances
return layers; 
  });
}
export async function defineActions(event) {
  const item = event.item;
  await item.layer.when();

  // Define actions that should be available for all layers
  const commonActions = [
    {
      title: "Go to full extent",
      icon: "zoom-out-fixed",
      id: "full-extent"
    },
    {
      title: "Layer information",
      icon: "information",
      id: "information"
    }
  ];

  // Define actions that should only appear for operational layers
  const operationalActions = [
    {
      title: "Increase opacity",
      icon: "chevron-up",
      id: "increase-opacity"
    },
    {
      title: "Decrease opacity",
      icon: "chevron-down",
      id: "decrease-opacity"
    }
  ];

  // Set actions for all layers
  item.actionsSections = [commonActions];
  
  // Add operational actions only if layer isn't a basemap
  if (!item.layer.basemap) {
    item.actionsSections.push(operationalActions);
  }
}

export function createLayerList(view) {
  return loadModules(["esri/widgets/LayerList"], {
    css: true,
  }).then(([LayerList]) => {
    const layerList = new LayerList({
      view: view,
      listItemCreatedFunction: defineActions
    });

    layerList.on("trigger-action", (event) => {
      const { action, item } = event;
      const layer = item.layer;

      switch (action.id) {
        case "full-extent":
          if (layer.fullExtent) {
            view.goTo(layer.fullExtent).catch((error) => {
              if (error.name !== "AbortError") {
                console.error(error);
              }
            });
          }
          break;
          
        case "information":
          if (layer.url) {
            window.open(layer.url);
          }
          break;
          
        case "increase-opacity":
          if (layer.opacity < 1) {
            layer.opacity = Math.min(1, layer.opacity + 0.25);
          }
          break;
          
        case "decrease-opacity":
          if (layer.opacity > 0) {
            layer.opacity = Math.max(0, layer.opacity - 0.25);
          }
          break;
          
        default:
          console.warn(`Unknown action: ${action.id}`);
      }
    });

    return layerList;
  });
}


/**
 * Creates Esri Feature Layer using url
  * @param {string} name layer name (title)
   * @param {string} url layer url
  * @param {string} id layer id
   * @param {object} options
   * @returns featuere layer
 */
export function createFeatureLayer(name, id, url, options) {
  return loadModules(["esri/layers/FeatureLayer"], {
    css: true,
  }).then(([FeatureLayer]) => {
    const layer = new FeatureLayer({
      title: name,
      url: url,
      id: id,
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
      const [Bookmarks] = await loadModules(['esri/widgets/Bookmarks'], {
          css: true,
      });
      
      const bookmarks = new Bookmarks({
          view: view,
          container: domId,
          editingEnabled: true,
        visibleElements: {
              addBookmarkButton: true,
              editBookmarkButton: true,
              time: true
          },
      });
      const newItems = [];
      for (const bookmark of initialBookmarks) {
          const MapExtent = JSON.parse(bookmark.mapExtent);
          const bookmarkObject = await createBookMarkObject(bookmark, MapExtent);
          newItems.push(bookmarkObject);
      }
      bookmarks.bookmarks.items = []
      bookmarks.bookmarks.items.splice(0, bookmarks.bookmarks.items.length);
      // newItems.forEach(item => {
      //   bookmarks.bookmarks.items.push(item); // Push new items individually
      // });
      bookmarks.bookmarks.items = newItems
      return bookmarks;
  } catch (error) {
      console.error('Error loading Bookmarks module:', error);
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
      const [Bookmark] = await loadModules(['esri/webmap/Bookmark'], {
          css: true,
      });
      const parsedDate = new Date(bookmark.creationDate.replace('|', ''));

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
      console.error('Error loading Expand module:', error);
      throw error;
  }
}


/**
 * Creates Query
  * @param {string} layerURL the layer url to query
 * @param {object} geometry optional
 * @returns features
 */
export const queryFeatureLayer = (
  layerURL,
  geometry = null
) => {
  return loadModules(["esri/layers/FeatureLayer", "esri/rest/support/Query"]).then(
      async ([FeatureLayer, Query]) => {
          var features = [];
          const layer = new FeatureLayer({
              url: layerURL
          });
          const query = new Query({
              where: "1=1",
              outFields: ["*"],
              returnGeometry: true
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

      }
  );
};

/**
 * Creates trace parameters for the trace operation.
 * @param {string} selectedTraceType - The globalId of the selected trace configuration.
 * @param {Array} traceLocations - The list of trace locations.
 * @returns {Object} - The trace parameters object.
 */
export const getTraceParameters = async (selectedTraceType, traceLocations) => {
  return loadModules(["esri/rest/networks/support/TraceParameters"], {
    css: true,
  }).then(
      ([TraceParameters]) => {
      
          const traceParameters = TraceParameters.fromJSON({
              traceConfigurationGlobalId: selectedTraceType,
              traceLocations: traceLocations
          });
          return traceParameters;
      }
  );
};


// export const createGraphic = async (geometry, symbol, spatialReference) => {
//   const [Graphic] = await loadModules(["esri/Graphic"], { css: true });

//   return new Graphic({
//     geometry: {
//       ...geometry,
//       spatialReference: spatialReference
//     },
//     symbol: symbol
//   });
// };


export const createGraphicFromFeature = async (geometry, symbol, attributes) => {
  const [Graphic] = await loadModules(["esri/Graphic"], { css: true });

  return new Graphic({
    geometry:geometry,
    symbol: symbol,
    attributes: attributes
  });
};

export const createGraphic = async (geometry, symbol, spatialReference, id = null) => {
  const [Graphic] = await loadModules(["esri/Graphic"], { css: true });

  return new Graphic({
    geometry: {
      ...geometry,
      spatialReference: spatialReference
    },
    symbol: symbol,
    attributes: id ? { id } : {}
  });
};



export const createGraphicsLayer = async () => {
  return loadModules(["esri/layers/GraphicsLayer"], {
    css: true,
  }).then(
      ([GraphicsLayer]) => {
        const graphicsLayer = new GraphicsLayer()
          return graphicsLayer;
      }
  );
};

export const createSketchViewModel = async (view, selectionLayer, symbol) => {
  return loadModules([
    "esri/widgets/Sketch/SketchViewModel"
  ], {
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

export const executeTrace = async (utilityNetworkServiceUrl, traceParameters) => {
  const [trace] = await loadModules(["esri/rest/networks/trace"], { css: true });

  return await trace.trace(utilityNetworkServiceUrl, traceParameters);
};

export const loadFeatureLayers = async (mapServerUrl) => {
  const [esriRequest] = await loadModules(["esri/request"], { css: true });

  try {
    const response = await esriRequest(mapServerUrl, {
      query: { f: "json" },
      responseType: "json",
    });

    return response.data;
  } catch (error) {
    console.error("Failed to load feature layers:", error);
    throw error;
  }
};

export function createQueryFeatures(url, where, fields = ["*"], returnGeometry,options) {
  return loadModules(["esri/rest/query"], {
      css: true,
  }).then(([query]) => {
    
      return query.executeQueryJSON(url, {  // autocasts as new Query()
          where: where,
          outFields: fields.length ? fields : ["*"],
          returnGeometry: returnGeometry,
          ...options
      }).then(function (results) {

          return results.features;
      }, function (error) {
          console.log(error); // will print error in console, if any
      });
  });
}

export async function createQueryFeaturesWithConditionWithGeo(url, condition, fields = ["*"], returnGeometry, geo) {
  return loadModules(["esri/rest/query"], {
      css: true,
  }).then(([query]) => {
      const queryParams = {
          where: condition,
          outFields: fields.length ? fields : ["*"],
          returnGeometry: returnGeometry
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