import './TraceResult.scss'
import { FaFolderOpen, FaFolder, FaFile, FaCaretDown, FaCaretRight } from "react-icons/fa";
import { LuTableProperties } from "react-icons/lu";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { createFeatureLayer, createQueryFeatures} from "../../../../handlers/esriHandler";


  export default function TraceResult({ setActiveTab }) {
  const categorizedElements = useSelector((state) => state.traceReducer.categorizedElementsIntial);
  const assetsData = useSelector((state) => state.traceReducer.assetsDataIntial);
  const layersData = useSelector((state) => state.traceReducer.traceLayersData);
  const utilityNetworkSelector = useSelector((state) => state.traceReducer.utilityNetworkIntial);
  const traceConfigHighlights = useSelector((state) => state.traceReducer.traceConfigHighlights);
  const traceResultGraphicsLayer = useSelector((state) => state.traceReducer.traceGraphicsLayer);
  const view = useSelector((state) => state.mapViewReducer.intialView);

  const [expandedSources, setExpandedSources] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedObjects, setExpandedObjects] = useState({});
  const [sourceToLayerMap, setSourceToLayerMap] = useState({});
  const [loadingObjects, setLoadingObjects] = useState({});
  const [queriedFeatures, setQueriedFeatures] = useState({});
  const [expandedTraceTypes, setExpandedTraceTypes] = useState({});
  const [colorPickerVisible, setColorPickerVisible] = useState({});
  const colorPalette = Object.values(window.traceConfig.TraceGraphicColors); 

  // const colorPalette = [
  //   'rgba(0, 0, 255, 1)',    // Blue
  //   'rgba(0, 255, 0, 1)',    // Green
  //   'rgba(255, 255, 0, 1)',  // Yellow
  //   'rgba(255, 165, 0, 1)'   // Orange
  // ];

  

  useEffect(() => {
    if (!assetsData?.domainNetworks) return;
  
    // Extract sourceId -> layerId mapping
    const mapping = {};
  
    assetsData.domainNetworks.forEach((network) => {
      [...network.edgeSources, ...network.junctionSources].forEach((source) => {
          mapping[source.sourceId] = source.layerId;
      });
    });
  
    setSourceToLayerMap(mapping);

  }, [assetsData, traceResultGraphicsLayer]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close all color pickers if click is outside any picker or color box
      const isColorPicker = e.target.closest('.color-picker-popup');
      const isColorBox = e.target.closest('.color-box');
      
      if (!isColorPicker && !isColorBox) {
        setColorPickerVisible({});
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  


  /**
 * Retrieves the layer name corresponding to the given `sourceId` from the `assetsData`.
 * This function searches through the domain networks, checking both junction sources and edge sources
 * to find a matching `sourceId` and returns the associated layer name. If no match is found, it returns the `sourceId` itself as a fallback.
 *
 * @param {string} sourceId - The ID of the source whose layer name is to be retrieved.
 * @returns {string} - The layer name corresponding to the `sourceId` if a match is found; otherwise, returns the `sourceId`.
 */
  const getLayerName = (sourceId) => {
    if (!assetsData || !assetsData.domainNetworks) return sourceId;
    
    // Search through all domain networks
    for (const domain of assetsData.domainNetworks) {
      // Check junction sources
      for (const junctionSource of domain.junctionSources) {
        if (junctionSource.sourceId === parseInt(sourceId)) {
          return junctionSource.layerName;
        }
      }
      // Check edge sources
      for (const edgeSource of domain.edgeSources) {
        if (edgeSource.sourceId === parseInt(sourceId)) {
          
          return edgeSource.layerName;
        }
      }
    }


    return sourceId; // Fallback to sourceId if no match is found
  };



  /**
 * Retrieves the asset group name corresponding to the given `sourceId` and `assetGroupCode` from the `assetsData`.
 * The function searches through all domain networks, checking both junction sources and edge sources for a matching `sourceId`.
 * Once the corresponding source is found, it looks for the asset group with the given `assetGroupCode`. If a match is found, the asset group name is returned. 
 * If no match is found, the provided `assetGroupCode` is returned as a fallback.
 *
 * @param {string} sourceId - The ID of the source whose asset group name is to be retrieved.
 * @param {string} assetGroupCode - The code of the asset group whose name is to be retrieved.
 * @returns {string} - The asset group name corresponding to the `sourceId` and `assetGroupCode`, or the `assetGroupCode` itself if no match is found.
 */
  const getAssetGroupName = (sourceId, assetGroupCode) => {
    if (!assetsData || !assetsData.domainNetworks) return assetGroupCode;
    
    // Search through all domain networks
    for (const domain of assetsData.domainNetworks) {
      // Check junction sources
      for (const junctionSource of domain.junctionSources) {
        if (junctionSource.sourceId === parseInt(sourceId)) {
          const assetGroup = junctionSource.assetGroups?.find(group => 
            group.assetGroupCode === parseInt(assetGroupCode)
          );
          return assetGroup?.assetGroupName || assetGroupCode;
        }
      }
      // Check edge sources
      for (const edgeSource of domain.edgeSources) {
        if (edgeSource.sourceId === parseInt(sourceId)) {
          const assetGroup = edgeSource.assetGroups?.find(group => 
            group.assetGroupCode === parseInt(assetGroupCode)
          );
          return assetGroup?.assetGroupName || assetGroupCode;
        }
      }
    }
    return assetGroupCode; // Fallback to assetGroupCode if no match is found
  };




  /**
 * Retrieves the asset type name corresponding to the given `sourceId`, `assetGroupCode`, and `assetTypeCode` from the `assetsData`.
 * The function searches through all domain networks, checking both junction sources and edge sources for a matching `sourceId`. 
 * Once the corresponding source is found, it looks for the asset group with the given `assetGroupCode`. 
 * If the asset group is found, it searches for the asset type corresponding to the `assetTypeCode`. 
 * If a match is found, the asset type name is returned. If no match is found, the provided `assetTypeCode` is returned as a fallback.
 *
 * @param {string} sourceId - The ID of the source whose asset type name is to be retrieved.
 * @param {string} assetGroupCode - The code of the asset group to which the asset type belongs.
 * @param {string} assetTypeCode - The code of the asset type whose name is to be retrieved.
 * @returns {string} - The asset type name corresponding to the `sourceId`, `assetGroupCode`, and `assetTypeCode`, or the `assetTypeCode` itself if no match is found.
 */
  const getAssetTypeName = (sourceId, assetGroupCode, assetTypeCode) => {
    if (!assetsData || !assetsData.domainNetworks) return assetTypeCode;
    
    for (const domain of assetsData.domainNetworks) {
      // Check junction sources
      for (const junctionSource of domain.junctionSources) {
        if (junctionSource.sourceId === parseInt(sourceId)) {
          const assetGroup = junctionSource.assetGroups?.find(group => 
            group.assetGroupCode === parseInt(assetGroupCode)
          );
          if (assetGroup) {
            const assetType = assetGroup.assetTypes?.find(type => 
              type.assetTypeCode === parseInt(assetTypeCode)
            );
            return assetType?.assetTypeName || assetTypeCode;
          }
        }
      }
      // Check edge sources
      for (const edgeSource of domain.edgeSources) {
        if (edgeSource.sourceId === parseInt(sourceId)) {
          const assetGroup = edgeSource.assetGroups?.find(group => 
            group.assetGroupCode === parseInt(assetGroupCode)
          );
          if (assetGroup) {
            const assetType = assetGroup.assetTypes?.find(type => 
              type.assetTypeCode === parseInt(assetTypeCode)
            );
            return assetType?.assetTypeName || assetTypeCode;
          }
        }
      }
    }
    return assetTypeCode;
  };



/**
 * Toggles the visibility state of a given trace type in the expanded trace types state.
 * This function updates the `expandedTraceTypes` state by flipping the visibility of the specified trace type 
 * between `true` (expanded) and `false` (collapsed). It ensures that the state of all trace types is preserved,
 * while only toggling the specific trace type provided.
 *
 * @param {string} traceType - The trace type whose visibility state is to be toggled.
 */
  const toggleTraceType = (traceType) => {
    setExpandedTraceTypes(prev => ({
      ...prev,
      [traceType]: !prev[traceType]
    }));
  };


  /**
 * Toggles the visibility state of a specified network source in the expanded sources state.
 * This function updates the `expandedSources` state by flipping the visibility of the provided 
 * network source between `true` (expanded) and `false` (collapsed). It preserves the state of other 
 * network sources while only toggling the visibility of the specified one.
 *
 * @param {string} networkSource - The network source whose visibility state is to be toggled.
 */
  const toggleSource = (networkSource) => {
    setExpandedSources((prev) => ({
      ...prev,
      [networkSource]: !prev[networkSource],
    }));
  };



  /**
 * Toggles the visibility state of a specified asset group within a given network source.
 * This function updates the `expandedGroups` state by flipping the visibility of the asset group
 * associated with the provided `networkSource` and `assetGroup`. It ensures that the state of other 
 * asset groups is preserved while only toggling the visibility of the specific group.
 *
 * @param {string} networkSource - The network source that the asset group belongs to.
 * @param {string} assetGroup - The asset group whose visibility state is to be toggled.
 */
  const toggleGroup = (networkSource, assetGroup) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [`${networkSource}-${assetGroup}`]: !prev[`${networkSource}-${assetGroup}`],
    }));
  };




/**
 * Toggles the visibility state of a specified asset type within a given asset group and network source.
 * This function updates the `expandedTypes` state by flipping the visibility of the asset type
 * associated with the provided `networkSource`, `assetGroup`, and `assetType`. It preserves the state of 
 * other asset types while only toggling the visibility of the specific asset type.
 *
 * @param {string} networkSource - The network source that the asset group and asset type belong to.
 * @param {string} assetGroup - The asset group that contains the asset type.
 * @param {string} assetType - The asset type whose visibility state is to be toggled.
 */
  const toggleType = (networkSource, assetGroup, assetType) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [`${networkSource}-${assetGroup}-${assetType}`]: !prev[`${networkSource}-${assetGroup}-${assetType}`],
    }));
  };






  /**
 * Queries a feature from the specified layer by its ObjectID and formats the feature's attributes.
 * This function fetches a feature from a layer using the provided `layerId` and `objectId`. After querying
 * the feature, it formats the returned attributes based on the field definitions of the layer, including
 * alias names if available. If no feature is found, the function returns `null`.
 * 
 * @param {string} layerId - The unique identifier of the feature layer to query.
 * @param {number} objectId - The ObjectID of the feature to retrieve from the layer.
 * @returns {Object|null} - The formatted attributes of the feature if found, otherwise `null`.
 */
  const queryFeatureByObjectId = async (layerId, objectId) => {
    try {

      console.log("Looking forr >>>>", layerId, objectId)

      // Filter out undefined or invalid layers
      const validLayers = layersData.filter(layer => layer && layer.layerId !== undefined);

      const selectedLayer = validLayers.find(layer => layer.layerId === layerId);

      

      const selectedLayerUrl = `${utilityNetworkSelector.featureServiceUrl}/${layerId}`;

      if (!selectedLayer) {
        console.error(`Layer with ID ${layerId} not found.`);
        return null;
      }
      const results= await createQueryFeatures(selectedLayerUrl,`objectid = ${objectId}`,["*"],true)
      
      const layer = await createFeatureLayer("TraceResult","TraceResult",selectedLayerUrl,{outFields: ["*"]})
      await layer.load();
  
      if (results.length > 0) {
        const feature = results[0];
        const formattedAttributes = {};
        
        // Format each attribute
        for (const [fieldName, value] of Object.entries(feature.attributes)) {
          const field = layer.fields.find(f => f.name === fieldName);
          
          if (field) {
            formattedAttributes[field.alias || field.name] = formatFieldValue(value, field);
          } else {
            formattedAttributes[fieldName] = formatGenericValue(value);
          }
        }

        return {
          attributes: formattedAttributes,
          geometry: feature.geometry
        };
      }
  
      return null;
    } catch (error) {
      console.error("Error querying feature:", error);
      return null;
    }
  };




/**
 * Handles the click event for an object, querying its data and optionally zooming to it.
 * The function first checks if the requested object data is already available. If it is, 
 * it may optionally zoom to the object's geometry. If the data is not available, it will 
 * query the object data from the service and zoom if needed.
 * 
 * @param {string} networkSource - The source of the network, used to determine which layer to query.
 * @param {string} assetGroup - The group of assets the object belongs to.
 * @param {string} assetType - The type of asset within the group.
 * @param {number} objectId - The unique identifier of the object to query.
 * @param {boolean} [shouldZoom=true] - Flag indicating whether to zoom to the object’s geometry.
 */
  const handleObjectClick = async (networkSource, assetGroup, assetType, objectId, shouldZoom = true) => {
    const key = `${networkSource}-${assetGroup}-${assetType}-${objectId}`;
    
    // If we already have the data
    if (queriedFeatures[key]) {
      if (shouldZoom && queriedFeatures[key].geometry) {
        view.goTo({
          target: queriedFeatures[key].geometry,
          zoom: 15
        }).catch(error => {
          if (error.name !== "AbortError") {
            console.error("Zoom error:", error);
          }
        });
      }
      return;
    }
  
    // Otherwise, query the data
    setLoadingObjects((prev) => ({ ...prev, [key]: true }));
  
    try {
      const featureData = await queryFeatureByObjectId(sourceToLayerMap[networkSource], objectId);
      
      if (featureData) {
        setQueriedFeatures((prev) => ({ ...prev, [key]: featureData }));
  
        if (shouldZoom && featureData.geometry) {
          view.goTo({
            target: featureData.geometry,
            zoom: 20
          }).catch(error => {
            if (error.name !== "AbortError") {
              console.error("Zoom error:", error);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error handling object:", error);
    } finally {
      setLoadingObjects((prev) => ({ ...prev, [key]: false }));
    }
  };
  



/**
 * Toggles the visibility of the details for a specific object.
 * This function updates the state to either expand or collapse the details
 * of an object based on its unique identifiers. The object’s visibility is 
 * toggled by flipping the boolean state stored for the given key.
 * 
 * @param {string} networkSource - The source of the network, used to identify the layer or context.
 * @param {string} assetGroup - The group of assets to which the object belongs.
 * @param {string} assetType - The type of asset within the asset group.
 * @param {number} objectId - The unique identifier of the object whose details are being toggled.
 */
  const toggleObject = (networkSource, assetGroup, assetType, objectId) => {
    const key = `${networkSource}-${assetGroup}-${assetType}-${objectId}`;
    setExpandedObjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };




  /**
 * Formats the value of a field based on its type and domain.
 * This function processes different field types (e.g., date, boolean, numeric, coded value domains)
 * and formats the value accordingly. If the field has a domain with coded values, it returns
 * the corresponding name. For date fields, it formats the value as a locale-based date and time string.
 * It also handles null, undefined, and empty values, returning an empty string for such cases.
 * 
 * @param {any} value - The value of the field to be formatted.
 * @param {Object} field - The field object containing metadata such as type and domain.
 * @returns {string} - The formatted value as a string.
 */
  const formatFieldValue=(value, field) => {
    if (value === null || value === undefined || value === "") return "";
    
    // Handle date fields
    if (field.type === "date") {
      try {
        const date = new Date(value);
        return date.toLocaleDateString() + ", " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      } catch {
        return value;
      }
    }
    
    // Handle coded value domains (like Asset Group and Asset Type)
    if (field.domain && field.domain.type === "coded-value") {
      const codedValue = field.domain.codedValues.find(cv => cv.code === value);
      return codedValue ? codedValue.name : value;
    }
    
    // Handle boolean fields
    if (field.type === "integer" && field.domain && field.domain.name === 'esriFieldDomainTypeBoolean') {
      return value ? "True" : "False";
    }
    
    // Handle numeric values that shouldn't be treated as booleans
    if (field.type === "integer" || field.type === "double") {
      return value;
    }
    
    return formatGenericValue(value);
    };



  /**
 * Formats a generic field value based on its type.
 * This function handles null, undefined, and empty values by returning an empty string.
 * It ensures that numbers are not mistakenly converted to booleans and formats actual boolean
 * values as "True" or "False".
 * 
 * @param {any} value - The value to be formatted.
 * @returns {string|any} - The formatted value, or the original value if no specific formatting is needed.
 */
  const formatGenericValue=(value) => {
    if (value === null || value === undefined || value === "") return "";
    
    // Don't convert numbers to booleans
    if (typeof value === "number") return value;
    
    // Handle actual booleans
    if (typeof value === "boolean") return value ? "True" : "False";
    
    return value;
    };

 
  /**
 * Renders a table of feature details for a given key, displaying attributes and their values.
 * The function checks if the feature is loading or available, and formats the feature's 
 * attributes into a readable table. If the feature is not available, it returns null.
 * 
 * @param {string} key - The unique key associated with the feature whose details need to be rendered.
 * @returns {JSX.Element|null} - A loading indicator if the feature is still loading, 
 * or a table displaying the feature's attributes and their values, or null if no feature data is available.
 */
  const renderFeatureDetails = (key) => {

    if (loadingObjects[key]) {
      return <div className="loading-text">Loading...</div>;
    }

    const feature = queriedFeatures[key];
  
    if (!feature || !feature.attributes) return null;
  
    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#323232',
            backgroundColor: '#fff',
            border: '1px solid #dcdcdc',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f7f7f7' }}>
              <th style={{
                textAlign: 'left',
                padding: '8px',
                borderBottom: '1px solid #dcdcdc',
                whiteSpace: 'nowrap'
              }}>
                <strong>Property</strong>
              </th>
              <th style={{
                textAlign: 'left',
                padding: '8px',
                borderBottom: '1px solid #dcdcdc',
                whiteSpace: 'nowrap'
              }}>
                <strong>Value</strong>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(feature.attributes).map(([field, value], idx) => (
              <tr
                key={field}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                }}
              >
                <td style={{
                  padding: '8px',
                  borderBottom: '1px solid #eaeaea',
                  wordBreak: 'break-word'
                }}>
                  {field}
                </td>
                <td style={{
                  padding: '8px',
                  borderBottom: '1px solid #eaeaea',
                  wordBreak: 'break-word'
                }}>
                  {value !== "" ? value : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };



  /**
 * Handles the click event on the color box associated with a specific trace type.
 * It prevents the propagation of the click event to avoid triggering other UI interactions 
 * and toggles the visibility of the color picker for the specified trace type.
 * 
 * @param {string} traceId - The unique identifier of the trace type for which the color picker is toggled.
 * @param {Object} e - The event object associated with the click event.
 */
  const handleColorBoxClick = (traceId, e) => {
    e.stopPropagation(); // Prevent the trace type from toggling
    setColorPickerVisible(prev => ({
      ...prev,
      [traceId]: !prev[traceId]
    }));
  };



  /**
 * Handles the color selection event for a specific trace type. 
 * This function updates the color of the graphics associated with the trace type 
 * in the graphics layer and stores the new color in the configuration. 
 * It also hides the color picker after the selection.
 * 
 * @param {string} traceId - The unique identifier of the trace type whose color is being updated.
 * @param {string} color - The new color selected for the trace type, in a valid color format (e.g., hex, rgb).
 * @param {Object} e - The event object associated with the color selection.
 */
  const handleColorSelect = (traceId, color, e) => {
    e.stopPropagation();

    traceResultGraphicsLayer.graphics.forEach(graphic => {
      
      if (graphic.symbol && graphic.attributes?.id === traceId){
        graphic.symbol = {
          type: "simple-line",
          color: color,
          width: 3
        };
        console.log(`Selected new color for ${traceId}:`, color);
      // modify color of trace type
      traceConfigHighlights[traceId] = color;

      }
  });

    setColorPickerVisible(prev => ({
      ...prev,
      [traceId]: false
    }));
  };


  return (
    <div className="trace-result">
      <h4 onClick={() => setActiveTab("input")}>back</h4>
      <h4>Trace Results</h4>
      {categorizedElements && Object.keys(categorizedElements).length > 0 ? (
        <div className="result-container">

          {/* Loop through each starting point */}
          {Object.entries(categorizedElements).map(([startingPointId, traceResults]) => (
            <div key={startingPointId} className="starting-point-box">
              <h4 className="starting-point-id">
                Starting Point: <code>{startingPointId}</code>
              </h4>



              {/* Loop through each trace type under this starting point */}
              {Object.entries(traceResults).map(([traceId, result]) => (
              // {Object.entries(categorizedElements).map(([traceId, result]) => (
                <div key={traceId} className="trace-type-box">
                  <div className="trace-type-header" onClick={() => toggleTraceType(traceId)}>
                    {expandedTraceTypes[traceId] ? <FaCaretDown /> : <FaCaretRight />}
                    <h5 className="trace-id">{traceId} Result
                    <div className="color-box-container">
                    <span
                        className="color-box"
                        style={{ backgroundColor: traceConfigHighlights[traceId] }}
                        onClick={(e) => handleColorBoxClick(traceId, e)}
                      />

                      
                      {/* Color picker popup */}
                      {colorPickerVisible[traceId] && (
                        <div 
                          className="color-picker-popup"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {colorPalette.map((color, index) => (
                            <div
                              key={index}
                              className="color-option"
                              style={{ backgroundColor: color }}
                              onClick={(e) => handleColorSelect(traceId, color, e)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    </h5>
                  </div>

                  
                  {expandedTraceTypes[traceId] && (
                    <div className="trace-group">

                      {Object.entries(result).map(([networkSource, assetGroups]) => (
                      // {Object.entries(categorizedElements).map(([networkSource, assetGroups]) => (
                        <div key={networkSource} className="feature-layers">
                          <div className="layer-header" onClick={() => toggleSource(networkSource)}>
                            {/* <span>
                              {expandedSources[networkSource] ? <FaFolderOpen /> : <FaFolder />} Network Source {networkSource} ({Object.values(assetGroups).flat().length})
                            </span> */}
                            <span>
                              {expandedSources[networkSource] ? <FaFolderOpen className="folder-icon"/> : <FaFolder className="folder-icon"/>} 
                              {assetsData ? getLayerName(networkSource) : `Network Source ${networkSource}`} 
                              ({Object.values(assetGroups).flat().length})
                            </span>
                            <span>{expandedSources[networkSource] ? <FaCaretDown /> : <FaCaretRight/>}</span>
                          </div>
                          {expandedSources[networkSource] && (
                            <div className="asset-groups">
                              {Object.entries(assetGroups).map(([assetGroup, assetTypes]) => (
                                <div key={assetGroup} className="asset-group">
                                  <div className="group-header" onClick={() => toggleGroup(networkSource, assetGroup)}>
                                    {/* <span>
                                      {expandedGroups[`${networkSource}-${assetGroup}`] ? <FaFolderOpen /> : <FaFolder />} Asset Group {assetGroup} ({Object.values(assetTypes).flat().length})
                                    </span> */}
                                    <span>
                                      {expandedGroups[`${networkSource}-${assetGroup}`] ? <FaFolderOpen className="folder-icon"/> : <FaFolder className="folder-icon"/>} 
                                      {assetsData ? getAssetGroupName(networkSource, assetGroup) : `Asset Group ${assetGroup}`} 
                                      ({Object.values(assetTypes).flat().length})
                                    </span>

                                    <span>{expandedGroups[`${networkSource}-${assetGroup}`] ? <FaCaretDown /> : <FaCaretRight />}</span>
                                  </div>
                                  {expandedGroups[`${networkSource}-${assetGroup}`] && (
                                    <div className="asset-types">
                                      {Object.entries(assetTypes).map(([assetType, elements]) => (
                                        <div key={assetType} className="asset-type">
                                          <div className="type-header" onClick={() => toggleType(networkSource, assetGroup, assetType)}>
                                            {/* <span>
                                              {expandedTypes[`${networkSource}-${assetGroup}-${assetType}`] ? <FaFolderOpen /> : <FaFolder />} Asset Type {assetType} ({elements.length})
                                            </span> */}
                                            <span>
                                              {expandedTypes[`${networkSource}-${assetGroup}-${assetType}`] ? <FaFolderOpen className="folder-icon"/> : <FaFolder className="folder-icon"/>} 
                                              {assetsData ? getAssetTypeName(networkSource, assetGroup, assetType) : `Asset Type ${assetType}`} 
                                              ({elements.length})
                                            </span>
                                            <span>{expandedTypes[`${networkSource}-${assetGroup}-${assetType}`] ? <FaCaretDown /> : <FaCaretRight />}</span>
                                          </div>
                                          {expandedTypes[`${networkSource}-${assetGroup}-${assetType}`] && (

                                            <ul className="elements-list">
                                              {elements.map((element, index) => {
                                                const key = `${networkSource}-${assetGroup}-${assetType}-${element.objectId}`;
                                                return (
                                                  <li key={index} className="element-item">
                                                    {/* <div className="object-header" onClick={() => toggleObject(networkSource, assetGroup, assetType, element.objectId, element)}> */}
                                                    <div className="object-header" onClick={() => handleObjectClick(networkSource, assetGroup, assetType, element.objectId, true)}>
                                                      <span><FaFile /> Object ID: {element.objectId}</span>
                                                      {/* <span>{expandedObjects[key] ? <FaCaretDown /> : <FaCaretRight />}</span> */}
                                                      <span onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleObjectClick(networkSource, assetGroup, assetType, element.objectId, false);
                                                          toggleObject(networkSource, assetGroup, assetType, element.objectId);
                                                        }}><LuTableProperties /></span>
                                                    </div>
                                                    {expandedObjects[key] && renderFeatureDetails(key)}
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          
                                          
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                    </div>

                  )}

                </div>
                      
              ))}

            </div>
          ))}



        </div>

      ) : (
        <p className="no-results">No trace results available.</p>
      )}
    </div>
  );

  

}
