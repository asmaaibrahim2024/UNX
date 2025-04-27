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
        },
        polygonSymbol: {
            type: "simple-fill",
            color: [255, 165, 0, 0.3],
            style: "solid",
            outline: {
                color: [255, 140, 0, 1],
                width: 2
            }
        }
        
    },
    TraceGraphicColors: {
        blue: 'rgba(0, 0, 255, 1)',    // Blue
        green: 'rgba(0, 255, 0, 1)',    // Green
        yellow: 'rgba(255, 255, 0, 1)',  // Yellow
        purple: 'rgba(128, 0, 128, 1)',   // Purple
        pink: 'rgba(255, 105, 180, 1)',    // Pink
        orange: 'rgba(255, 165, 0, 1)'   // Orange
    }
};
