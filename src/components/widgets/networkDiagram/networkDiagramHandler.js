import {
    makeEsriRequest
  } from "../../../handlers/esriHandler";


const requestNetworkDiagramServer = async (networkDiagramServerUrl) => {
    try {
    const networkDiagramServer = await makeEsriRequest(networkDiagramServerUrl);
    console.log("Network Diagram Server", networkDiagramServer)
    } catch (error) {
    console.error("Failed to load network diagram server:", error);
    }
}

const getDiagram = async (diagramsUrl, diagramName) => {
    let dgUrl = diagramsUrl + "/" + diagramName;

    try {
    const diagram = await makeEsriRequest(dgUrl);
    console.log("One Diagram by name", diagram);
    } catch (error) {
    console.error("Failed to load One Diagram by name:", error);
    
    }
}

const getDiagrams = async (diagramsUrl) => {
    try {
    const diagrams = await makeEsriRequest(diagramsUrl);
    const diagramNames = diagrams?.diagramNames;
    diagramNames.forEach( name => {
        getDiagram(diagramsUrl, name)
        console.log("Diagram Name", name)
    })
    console.log("Diagrams", diagrams)
    } catch (error) {
    console.error("Failed to load Diagrams:", error);
    
    }
}

const getDiagramTemplates = async (templatesUrl) => {
    try {
    const templates = await makeEsriRequest(templatesUrl);
    console.log("Diagrams Templates", templates)
    return templates;
    } catch (error) {
    console.error("Failed to load Diagrams Templates:", error);
    }
}


export const getNetworkDiagramInfos = async (networkDiagramServerUrl) => {

    let diagramsUrl = networkDiagramServerUrl + "/diagrams";
    let templatesUrl = networkDiagramServerUrl + "/templates";

    requestNetworkDiagramServer(networkDiagramServerUrl);
    getDiagrams(diagramsUrl);
    const diagramTemplates = getDiagramTemplates(templatesUrl)

return diagramTemplates
}