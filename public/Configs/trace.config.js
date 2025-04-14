window.traceConfig = {
    Symbols: {
        multipointSymbol: {
            type: "simple-marker",
            color: [255, 0, 0, 1], 
            size: 8,
            outline: {
                color: [255, 255, 255, 1], 
                width: 1
            }
        },
        polylineSymbol: {
            type: "simple-line",
            color: [0, 0, 255, 1], 
            width: 3
        }
    },
    TraceSettings: {
        // supportedTraceClass: "esriUNFCUTLine",
        supportedTraceClasses: ["esriUNFCUTDevice", "esriUNFCUTJunction", "esriUNFCUTLine"],
        percentageAlong: 0.7
    },
    TraceGraphicColors: {
        blue: 'rgba(0, 0, 255, 1)',    // Blue
        green: 'rgba(0, 255, 0, 1)',    // Green
        yellow: 'rgba(255, 255, 0, 1)',  // Yellow
        orange: 'rgba(255, 165, 0, 1)'   // Orange
    }
};
