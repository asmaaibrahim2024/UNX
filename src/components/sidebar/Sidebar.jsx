import { useState } from "react";
import TraceWidget from "../widgets/trace/TraceWidget";
import Find from "../widgets/find/Find";
import Selection from "../widgets/selection/Selection";
import './Sidebar.scss';

const Sidebar = () => {
  const [showTraceWidget, setShowTraceWidget] = useState(false);
  const [showFindWidget, setShowFindWidget] = useState(false);
  const [showSelectionWidget, setShowSelectionWidget] = useState(false);


  const handleTraceClick = () => {
    setShowTraceWidget((prev) => !prev);
  };
  
  const handleFindClick = () => {
    setShowFindWidget((prev) => !prev);
  };
  const handleSelectionClick = () => {
    setShowSelectionWidget((prev) => !prev);
  };
  return (
    <div className="sidebar">
      <button className="trace-button" onClick={handleTraceClick}>
      <span className="trace-text">Trace</span>
      </button>
      <button className="trace-button" onClick={handleFindClick}>
      <span className="trace-text">Find</span>
      </button>
      <button className="trace-button" onClick={handleSelectionClick}>
      <span className="trace-text">Selection</span>
      </button>
      <TraceWidget isVisible={showTraceWidget} />
      <Find isVisible={showFindWidget}/>
      <Selection isVisible={showSelectionWidget}/>
    </div>
  );
};

export default Sidebar;
