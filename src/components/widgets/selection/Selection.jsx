
import './Selection.scss';
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaFolderOpen, FaFolder, FaFile, FaCaretDown, FaCaretRight } from "react-icons/fa";
import { createGraphicsLayer, createSketchViewModel, createQueryFeaturesWithConditionWithGeo} from "../../../handlers/esriHandler";



export default function Selection({isVisible}) {
    //To access the config
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [isContainerVisible, setIsContainerVisible] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedTypes, setExpandedTypes] = useState({});
    const [expandedObjects, setExpandedObjects] = useState({});
    const view = useSelector((state) => state.mapViewReducer.intialView);


    useEffect(() => {
        if (!view) return;
        if(!isVisible)return;
      
        let selectionLayer;
        let sketchVM;
      
        const initialize = async () => {
          try {
            console.log(view, "viewviewview");
            
            selectionLayer = await createGraphicsLayer();
            await selectionLayer.load();
            view.map.add(selectionLayer);
            
            const polygonSymbol = {
              type: "simple-fill",
              color: [173, 216, 230, 0.2],
              outline: {
                color: [70, 130, 180],
                width: 2,
              },
            };
      
            sketchVM = await createSketchViewModel(view, selectionLayer, polygonSymbol);
            console.log(sketchVM,"sketchVM");
            
            view.container.style.cursor = "crosshair";
      
            const selectFeatures = async (geometry) => {
              try {
                const layers = view.map.allLayers.items.filter(
                  (layer) => layer.type === "feature"
                );
      
                if (!layers.length) {
                  console.warn("No feature layers found.");
                  return;
                }
      
                let allFeatures = [];
      
                for (const layer of layers) {
                    if (!layer.capabilities?.query) {
                      console.warn(`Layer ${layer.title} does not support querying.`);
                      continue;
                    }
                  
                    // Query using your createQueryFeatures function
                    const features = await createQueryFeaturesWithConditionWithGeo(
                      layer.parsedUrl.path,
                      '1=1',
                      layer.outFields?.length ? layer.outFields : ["*"],
                      true,geometry
                    )
                    console.log(features,"features");
                    
                    if (features.length) {
                      // console.log(`Selected Features from ${layer.title}:`, results.features.map(f => f.attributes));
                      allFeatures.push({ layerName: layer.title, features:features.map(f => f.attributes) });
                    } else {
                      // console.log(`No features found in ${layer.title}.`);
                    }
                  }
            
                  console.log(allFeatures,"featuresfeatures");

                setSelectedFeatures(allFeatures);
                setIsContainerVisible(true);
              } catch (error) {
                console.error("Error selecting features:", error);
                if (error.details) {
                  console.error("Detailed Error Info:", error.details);
                }
              }
            };
      
            sketchVM.on("create", async (event) => {
              if (event.state === "complete") {
                const geometry = event.graphic.geometry;
                await selectFeatures(geometry);
                view.container.style.cursor = "default";
                sketchVM.cancel();
              }
            });
      
            sketchVM.create("rectangle");
      
          } catch (error) {
            console.error("Error initializing selection:", error);
          }
        };
      
        initialize();
      
        return () => {
          if (view) {
            view.container.style.cursor = "default";
            if (selectionLayer) {
              view.map.remove(selectionLayer);
            }
            if (sketchVM) {
              sketchVM.destroy();
            }
          }
        };
      }, [view,isVisible]);



    const resetSelection = () => {
      setSelectedFeatures([]);
      setIsContainerVisible(false); // Hide the floating container
    };
  

    const toggleGroup = (assetGroup) => {
      setExpandedGroups((prev) => ({
        ...prev,
        [assetGroup]: !prev[assetGroup],
      }));
    };
  

    const toggleType = (assetGroup, assetType) => {
      setExpandedTypes((prev) => ({
        ...prev,
        [`${assetGroup}-${assetType}`]: !prev[`${assetGroup}-${assetType}`],
      }));
    };
  

    const toggleObject = (assetGroup, assetType, objectId) => {
      setExpandedObjects((prev) => ({
        ...prev,
        [`${assetGroup}-${assetType}-${objectId}`]: !prev[`${assetGroup}-${assetType}-${objectId}`],
      }));
    };


    if (!isVisible) return null;


  return (
    <>
      {isContainerVisible && (
        <div className="selection-container">
          <button className="close-btn" onClick={resetSelection}>
            ×
          </button>
          <div className="container-title">Selected Features</div>
          <button className="reset-btn" onClick={resetSelection}>
            Reset Selection
          </button>
          {selectedFeatures.map((group, index) => (
            <div key={index} className="feature-layers">
              <div className="layer-header" onClick={() => toggleGroup(group.layerName)}>
                <span>
                  {expandedGroups[group.layerName] ? <FaFolderOpen className="folder-icon"/> : <FaFolder className="folder-icon"/>} {group.layerName} ({group.features.length})
                </span>
                <span>{expandedGroups[group.layerName] ? <FaCaretDown /> : <FaCaretRight />}</span>
              </div>
              {expandedGroups[group.layerName] && (
                <div className="asset-groups">
                  {Object.entries(
                    group.features.reduce((acc, feature) => {
                      const assetGroup = feature.assetgroup || "Unknown";
                      const assetType = feature.assettype || "Unknown";
                      if (!acc[assetGroup]) acc[assetGroup] = {};
                      if (!acc[assetGroup][assetType]) acc[assetGroup][assetType] = [];
                      acc[assetGroup][assetType].push(feature);
                      return acc;
                    }, {})
                  ).map(([assetGroup, assetTypes]) => {
                    const assetGroupName = assetGroup; // Fallback to code if name not found
                    return (
                      <div key={assetGroup} className="asset-group">
                        <div className="group-header" onClick={() => toggleType(assetGroup, assetTypes)}>
                          <span>
                            {expandedTypes[`${assetGroup}-${assetTypes}`] ? <FaFolderOpen className="folder-icon"/> : <FaFolder className="folder-icon"/>} {assetGroupName} ({Object.values(assetTypes).flat().length})
                          </span>
                          <span>{expandedTypes[`${assetGroup}-${assetTypes}`] ? <FaCaretDown /> : <FaCaretRight />}</span>
                        </div>
                        {expandedTypes[`${assetGroup}-${assetTypes}`] && (
                          <ul className="asset-types">
                            {Object.entries(assetTypes).map(([assetType, elements]) => {
                              const assetTypeName =  assetType; // Fallback to code if name not found
                              return (
                                <li key={assetType} className="asset-type">
                                  <div className="type-header" onClick={() => toggleObject(assetGroup, assetType, elements[0].objectid)}>
                                    <span><FaFile /> {assetTypeName}</span>
                                    <span>{expandedObjects[`${assetGroup}-${assetType}-${elements[0].objectid}`] ? <FaCaretDown /> : <FaCaretRight />}</span>
                                  </div>
                                  {expandedObjects[`${assetGroup}-${assetType}-${elements[0].objectid}`] && (
                                    <div className="elements-list">
                                      <table>
                                        <tbody>
                                          {elements.map((element, i) => (
                                            <tr key={i}>
                                              <td className="detail-key">Object ID</td>
                                              <td className="detail-value">{element.objectid}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
