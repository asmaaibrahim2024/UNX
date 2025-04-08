window.mapConfig = {
    portalUrls: {
        portalUrl3D: "https://wf-dgda.eastus2.cloudapp.azunre.com/portal/",
        portalUrl: "https://www.arcgis.com",
        portalItemIdAr: "9a6723e7d3054f32832f48b4355e95c6",
        portalItemIdEn: "471eb0bf37074b1fbb972b1da70fb310",
        portalItemId3d: "4ea40ef7c36a47389e082939a2d16397",
        layer360Url: "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/Hosted/DGDA_360Panos/FeatureServer/0"
    },
    services: {
        PrintService: {
            "AR_URl": "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
            "EN_URL": "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
        },
        geometryEngineServiceUrl: "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
        googleLocationUrl: "https://www.google.com/maps/place/",
        loggerUrl: "",
        exportFeautureLayerToShapefileServiceUrl: "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/FeatureClassToShapefile/GPServer/FeatureClassToSHP",
        exportFeautureLayerToCADfileServiceUrl: "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/FeatureClassToCAD/GPServer/FeatureClassToCAD",
        exportCadResultsPath: "https://wf-dgda.eastus2.cloudapp.azure.com/DGDA_Mapviewer_ExportedFiles/",
        exportCadToFeaturesetServiceUrl: "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services/MapViewerGP/CadToDataSetService/GPServer/"
    },
    Configurations: {
        isConfiguredFromFE: true,
        enableOTP: false,
        isWebMap: true,
        is3DButtonShow: false,
        panosramaAttribute: "url"
    }
};