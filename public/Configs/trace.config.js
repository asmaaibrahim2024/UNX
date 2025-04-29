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
        blue: '#0000FF',    // Blue
        green: '#00FF00',    // Green
        yellow: '#FFFF00',   // Yellow
        purple: '#800080',   // Purple
        pink: '#FF69B4',     // Pink
        orange: '#FFA500'    // Orange
    }

};
