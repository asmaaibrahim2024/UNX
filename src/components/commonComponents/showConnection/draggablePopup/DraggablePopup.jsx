import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "../../../../handlers/languageHandler";

export default function DraggablePopup({ children }) {
  const { t, i18nInstance, direction } = useI18n("ShowConnection");

  const popupRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  // Center on initial render
  useEffect(() => {
    const popup = popupRef.current;
    if (popup) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = popup;

      setPosition({
        x: (innerWidth - offsetWidth) / 2,
        y: (innerHeight - offsetHeight) / 2 - 300, // the 300 is the height of the popup
      });
    }
  }, []);

  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;

    offsetRef.current = {
      x: startX - position.x,
      y: startY - position.y,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const style = {
    position: "absolute",
    top: 0,
    // left: 0,
    ...(direction === "rtl" ? { left: '-50%' } : { left: 0 }),
    ...(direction === "rtl" ? { transform: `translate(${position.x}px, ${position.y}px)` } : { transform: `translate(${position.x}px, ${position.y}px)` }),
    // transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: "grab",
  };

  return (
    <div ref={popupRef} style={style} onMouseDown={handleMouseDown}>
      {children}
    </div>
  );
}
