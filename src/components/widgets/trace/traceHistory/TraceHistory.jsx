import { React, useState, useEffect } from "react";
import { fetchTraceHistory } from "../traceHandler";

export default function TraceHistory() {

  

  useEffect(() => {
   console.log("Trace History component");

  //  async function getTraceHistory() {
  //  const traceHistory = await fetchTraceHistory();
  //  }
   
  //  getTraceHistory();

  }, []);




  return <>
     <div className="trace-history">
    
    </div>
  </>;
}
