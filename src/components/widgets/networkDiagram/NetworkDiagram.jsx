import { React, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import './NetworkDiagram.scss';
import {
  getNetworkDiagramInfos
} from "../networkDiagram/networkDiagramHandler";

export default function NetworkDiagram({ isVisible }) {
    const utilityNetwork = useSelector((state) => state.mapSettingReducer.utilityNetworkMapSetting);
    const [esriTemplates, setEsriTemplates] = useState([]);
    const [networkTemplates, setNetworkTemplates] = useState([]);

    // const [diagrams, setDiagrams] = useState([]);


    useEffect(() => {
      if (!utilityNetwork) return;
        
        const networkDiagramServerUrl = utilityNetwork.networkServiceUrl.replace(/\/UtilityNetworkServer\/?$/, "/NetworkDiagramServer");

        const networkServerInfoInit = async (networkDiagramServerUrl) => {
          const networkDiagramTemplates = await getNetworkDiagramInfos(networkDiagramServerUrl);
          if (networkDiagramTemplates?.templates?.length) {
            const allTemplates = networkDiagramTemplates.templates;
            const esriTemplateNames = window.networkDiagramConfig?.Configurations?.esriTemplateNames || [];
            const esriT = allTemplates.filter(t => esriTemplateNames.includes(t));
            const networkT = allTemplates.filter(t => !esriTemplateNames.includes(t));
        
            setEsriTemplates(esriT);
            setNetworkTemplates(networkT);
          }
        }

      networkServerInfoInit(networkDiagramServerUrl);


    }, [utilityNetwork])




    
    if (!isVisible) return null;
    return (
       <>
            <div className="network-diagram-widget">
             
              <div className="network-diagram-content">
                {esriTemplates.length || networkTemplates.length ? (
                  <>
                    <h3>Generate from stored templates</h3>

                    {esriTemplates.length > 0 && (
                      <div className="esri-templates-container">
                        <h4>Esri Templates</h4>
                        <div className="templates-buttons">
                          {esriTemplates.map((template, index) => (
                            <button key={index} className="template-btn">{template}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {networkTemplates.length > 0 && (
                      <div className="network-templates-container">
                        <h4>QSIT Templates</h4>
                        <div className="templates-buttons">
                          {networkTemplates.map((template, index) => (
                            <button key={index} className="template-btn">{template}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <h3>Generate from selection</h3>
                    <h4>Selected Features</h4>
                    <p>No selected features</p>
                    <button className="generate-diagram-btn">Generate</button>

                  </>
                ) : (
                  <p className="empty-data">No templates on this network.</p>
                )}
              </div>

           </div>
        </>
    );
}
