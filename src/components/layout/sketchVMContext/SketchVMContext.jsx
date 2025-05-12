// SketchVMContext.tsx
import React, { createContext, useRef, useContext } from "react";

const SketchVMContext = createContext(undefined);

export const SketchVMProvider = ({ children }) => {
  const sketchVMRef = useRef(null);

  return (
    <SketchVMContext.Provider value={{ sketchVMRef }}>
      {children}
    </SketchVMContext.Provider>
  );
};

export const useSketchVM = () => {
  const context = useContext(SketchVMContext);
  if (!context) {
    throw new Error("useSketchVM must be used within a SketchVMProvider");
  }
  return context;
};
