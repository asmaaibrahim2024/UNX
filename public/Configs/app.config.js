window.appConfig = {
    apiServer: {
        //  pimApiUrl: 'http://20.234.169.220/PimApiS',
        //  pimApiUrl: 'https://localhost:7001',
        pimApiUrl: 'https://utilitykit.eastus.cloudapp.azure.com/PimApiS',

         apiUrl:"https://localhost:7002/api/",
         appCode:"UNX",
        // utilityKitURL: 'http://localhost:6200',
        // utilityKitURL: 'http://20.234.169.220/UtilityKit/',
        utilityKitURL: 'https://utilitykit.eastus.cloudapp.azure.com/UtilityKit/',

        DGDA_ViewerNotifucationURL: "https://wf-dgda.eastus2.cloudapp.azure.com/DGDA_MapViewer_API/Notify",
    },
    arcGISApi: {
        ArcGISApiUrl:
            "https://prd-dgdagis.dgda.gov.sa/apps/4.27/init.js",
        ArcGISCssUrl:
            "https://prd-dgdagis.dgda.gov.sa/apps/4.27/esri/themes/light/main.css",
    },
    httpProxy: {
        useProxy: false,
        url: "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
        arcgisDomainServer: "prd-dgdagis.dgda.gov.sa",
        rules: [
            {
                urlPrefix: "https://prd-dgdagis.dgda.gov.sa/portal/",
                proxyUrl: "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
            },
            {
                urlPrefix: "https://prd-dgdagis.dgda.gov.sa/server/rest/services",
                proxyUrl: "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
            },
            {
                urlPrefix: "https://wf-dgda.eastus2.cloudapp.azure.com/workflow/rest/services",
                proxyUrl: "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
            },
            {
                urlPrefix: "https://prd-dgdagis.dgda.gov.sa/portal/sharing/rest",
                proxyUrl: "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
            },
            {
                urlPrefix:
                    "https://prd-dgdagis.dgda.gov.sa/portal/sharing/rest/generateToken",
                proxyUrl:
                    "https://prd-dgdagis.dgda.gov.sa/apps/DGDA_Workflow_API/api/Proxy/ProxyPage",
            },
        ],
    },
    Configurations: {
        isConfiguredFromFE: true,
        enableOTP: false,
        isWebMap: true,
        is3DButtonShow: false,
        panosramaAttribute: "url"
    },
    app: {
        versionNumber: "v0.0.00+UAT.000000",
        defaultLang: "en",
        enableAppThemeSetting: true,
    },
    localHost: {
        protocol: "http",
        host: "localhost",
        port: "",
    }
};