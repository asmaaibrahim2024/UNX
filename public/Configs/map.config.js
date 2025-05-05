window.mapConfig = {
  portalUrls: {
    portalUrl3D: "https://wf-dgda.eastus2.cloudapp.azunre.com/portal/",
    portalUrl: "https://www.arcgis.com",
    portalItemIdAr: "9a6723e7d3054f32832f48b4355e95c6",
    portalItemIdEn: "471eb0bf37074b1fbb972b1da70fb310",
    portalItemId3d: "4ea40ef7c36a47389e082939a2d16397",
    utilityNetworkLayerUrl:
      "https://sampleserver7.arcgisonline.com/server/rest/services/UtilityNetwork/NapervilleElectricV5/FeatureServer/8",
    // utilityNetworkLayerUrl: "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/communication/communication/FeatureServer/8",
    // utilityNetworkLayerUrl:"https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/utility/utilityNetwork/FeatureServer/0",
    // utilityNetworkLayerUrl: "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/Gas/Gas/FeatureServer/8",
    // utilityNetworkLayerUrl: "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/water/water/FeatureServer/8",
    // utilityNetworkLayerUrl: "https://utilitykit.eastus.cloudapp.azure.com/server/rest/services/communication/communication/FeatureServer/8",

    layer360Url:
      "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/Hosted/DGDA_360Panos/FeatureServer/0",
  },
  services: {
    printServiceUrl:
      "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    geometryEngineServiceUrl:
      "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
    googleLocationUrl: "https://www.google.com/maps/place/",
    loggerUrl: "",
    exportFeautureLayerToShapefileServiceUrl:
      "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/FeatureClassToShapefile/GPServer/FeatureClassToSHP",
    exportFeautureLayerToCADfileServiceUrl:
      "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/FeatureClassToCAD/GPServer/FeatureClassToCAD",
    exportCadResultsPath:
      "https://wf-dgda.eastus2.cloudapp.azure.com/DGDA_Mapviewer_ExportedFiles/",
    exportCadToFeaturesetServiceUrl:
      "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/CadToDataSetService/GPServer/",
  },
  Configurations: {
    isConfiguredFromFE: true,
    enableOTP: false,
    isWebMap: true,
    is3DButtonShow: false,
    panosramaAttribute: "url",
  },
  ApiSettings: {
    baseUrl: "https://utilitykit.eastus.cloudapp.azure.com/unx_api/",
    endpoints: {
      GetNetworkServiceById: "api/UtilityNetwork/GetNetworkServiceById/",
      GetNetworkLayersByNetowkrServiceId:
        "api/UtilityNetwork/GetNetworkLayersByNetowkrServiceId/",
      GetLayerFieldsByNetworkLayerId:
        "api/UtilityNetwork/GetLayerFieldsByNetworkLayerId/",
    },
  },
};
