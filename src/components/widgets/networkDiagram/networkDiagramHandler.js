// import { makeEsriRequest,displayNetworkDiagramHelper } from "../../../handlers/esriHandler";



// /**
//  * Fetches the network diagram server data from the provided URL.
//  * It makes an asynchronous request to the network diagram server and logs the result.
//  *
//  * @param {string} networkDiagramServerUrl - The URL of the network diagram server to be requested.
//  * @returns {Promise<void>} A promise that resolves when the server data is successfully fetched, or logs an error if the request fails.
//  */
// async function requestNetworkDiagramServer(networkDiagramServerUrl) {
//     try {
//     const networkDiagramServer = await makeEsriRequest(networkDiagramServerUrl);
//     // console.log("Network Diagram Server", networkDiagramServer)
//     } catch (error) {
//     console.error("Failed to load network diagram server:", error);
//     }
// }



// /**
//  * Fetches a specific network diagram by its name from a given URL and logs the response.
//  * If the request fails, it logs an error.
//  *
//  * @param {string} diagramsUrl - The URL for the collection of diagrams.
//  * @param {string} diagramName - The name of the diagram to fetch.
//  * @returns {Promise<void>} A promise that resolves when the diagram data is successfully fetched, or logs an error if the request fails.
//  */




// /**
//  * Fetches all the network diagrams from a given URL, logs the names of each diagram, 
//  * and fetches the details of each individual diagram.
//  * If the request fails, it logs an error.
//  *
//  * @param {string} diagramsUrl - The URL for the collection of diagrams.
//  * @returns {Promise<void>} A promise that resolves when all diagrams are fetched, or logs an error if the request fails.
//  */
// async function getDiagrams(diagramsUrl){
//     try {
//     const diagrams = await makeEsriRequest(diagramsUrl);
//     const diagramNames = diagrams?.diagramNames;
//     diagramNames.forEach( name => {
//         getDiagram(diagramsUrl, name)
//         // console.log("Diagram Name", name)
//     })
//     // console.log("Diagrams", diagrams)
//     } catch (error) {
//     console.error("Failed to load Diagrams:", error);
    
//     }
// }



// /**
//  * Fetches the diagram templates from a given URL and logs the response.
//  * If the request fails, it logs an error.
//  *
//  * @param {string} templatesUrl - The URL for the collection of diagram templates.
//  * @returns {Promise<Object|void>} A promise that resolves with the templates data if successful, 
//  * or logs an error if the request fails.
//  */
// async function getDiagramTemplates(templatesUrl) {
//     try {
//     const templates = await makeEsriRequest(templatesUrl);
//     // console.log("Diagrams Templates", templates);
//     return templates;
//     } catch (error) {
//     console.error("Failed to load Diagrams Templates:", error);
//     }
// }



// /**
//  * Fetches network diagram information by making requests to the provided server URL.
//  * It requests diagram data and diagram templates from the server and returns the templates.
//  * If the requests fail, it logs an error.
//  *
//  * @param {string} networkDiagramServerUrl - The base URL for the network diagram server.
//  * @returns {Promise<Object|void>} A promise that resolves with the diagram templates data if successful,
//  * or logs an error if any of the requests fail.
//  */
// export async function getNetworkDiagramInfos(networkDiagramServerUrl) {

//     let diagramsUrl = networkDiagramServerUrl + "/diagrams";
//     let templatesUrl = networkDiagramServerUrl + "/templates";

//     requestNetworkDiagramServer(networkDiagramServerUrl);
//     getDiagrams(diagramsUrl);
//     const diagramTemplates = getDiagramTemplates(templatesUrl)

// return diagramTemplates
// }
// //Makes a request
// export async function makeRequest(opts) {
//   return new Promise(function (resolve, reject) {
//     let xhr = new XMLHttpRequest();

//     xhr.open(opts.method, opts.url);
//     xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//     xhr.onload = function () {
//       if (this.status >= 200 && this.status < 300) {
//         let jsonRes = xhr.response;
//         if (typeof jsonRes !== "object") jsonRes = JSON.parse(xhr.response);
//         resolve(jsonRes);
//       } else {
//         reject({
//           status: this.status,
//           statusText: xhr.statusText,
//         });
//       }
//     };

//     //xhr.onerror =   err => reject({status: this.status, statusText: xhr.statusText}) ;
//     xhr.onerror = (err) => reject(err);

//     if (opts.headers)
//       Object.keys(opts.headers).forEach((key) =>
//         xhr.setRequestHeader(key, opts.headers[key])
//       );

//     let params = opts.params;
//     // We'll need to stringify if we've been given an object
//     // If we have a string, this is skipped.
//     if (params && typeof params === "object")
//       params = Object.keys(params)
//         .map(
//           (key) =>
//             encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
//         )
//         .join("&");

//     xhr.send(params);
//   });
// }

//         async function getDiagram(diagramsUrl, diagramName) {
//     let dgUrl = diagramsUrl + "/" + diagramName;

//     try {
//     const diagram = await makeEsriRequest(dgUrl);
//     // console.log("One Diagram by name", diagram);
//     } catch (error) {
//     console.error("Failed to load One Diagram by name:", error);
    
//     }
// }
//      export async function   applyLayoutAlgorithm(diagramsUrl,token,algorithmName, diagramName, contFeatures, junctionFeatures, edgesFeatures, layoutParams)
//         {
//           debugger
//           let applyLayoutUrl = diagramsUrl + "/" + diagramName  + "/applyLayout";
//           let postJson = {
//               token: token,
//               layoutParams : layoutParams,
//               layoutName : algorithmName,
//               containerObjectIDs: contFeatures,
//               junctionObjectIDs: junctionFeatures,
//               edgeObjectIDs:edgesFeatures,
//               f: "json"
//           }
//           console.log("applyLayoutUrl:", applyLayoutUrl);
//           console.log("postJson:", postJson);
//           return await makeRequest({method: 'POST', url: applyLayoutUrl, params: postJson});
//         }

///////////////////////////////////////////
import { makeEsriRequest } from "../../../handlers/esriHandler";



/**
 * Fetches the network diagram server data from the provided URL.
 * It makes an asynchronous request to the network diagram server and logs the result.
 *
 * @param {string} networkDiagramServerUrl - The URL of the network diagram server to be requested.
 * @returns {Promise<void>} A promise that resolves when the server data is successfully fetched, or logs an error if the request fails.
 */
async function requestNetworkDiagramServer(networkDiagramServerUrl) {
    try {
    const networkDiagramServer = await makeEsriRequest(networkDiagramServerUrl);
    // console.log("Network Diagram Server", networkDiagramServer)
    } catch (error) {
    console.error("Failed to load network diagram server:", error);
    }
}



/**
 * Fetches a specific network diagram by its name from a given URL and logs the response.
 * If the request fails, it logs an error.
 *
 * @param {string} diagramsUrl - The URL for the collection of diagrams.
 * @param {string} diagramName - The name of the diagram to fetch.
 * @returns {Promise<void>} A promise that resolves when the diagram data is successfully fetched, or logs an error if the request fails.
 */
async function getDiagram(diagramsUrl, diagramName) {
    let dgUrl = diagramsUrl + "/" + diagramName;

    try {
    const diagram = await makeEsriRequest(dgUrl);
    // console.log("One Diagram by name", diagram);
    } catch (error) {
    console.error("Failed to load One Diagram by name:", error);
    
    }
}



/**
 * Fetches all the network diagrams from a given URL, logs the names of each diagram, 
 * and fetches the details of each individual diagram.
 * If the request fails, it logs an error.
 *
 * @param {string} diagramsUrl - The URL for the collection of diagrams.
 * @returns {Promise<void>} A promise that resolves when all diagrams are fetched, or logs an error if the request fails.
 */
async function getDiagrams(diagramsUrl){
    try {
    const diagrams = await makeEsriRequest(diagramsUrl);
    const diagramNames = diagrams?.diagramNames;
    diagramNames.forEach( name => {
        getDiagram(diagramsUrl, name)
        // console.log("Diagram Name", name)
    })
    // console.log("Diagrams", diagrams)
    } catch (error) {
    console.error("Failed to load Diagrams:", error);
    
    }
}



/**
 * Fetches the diagram templates from a given URL and logs the response.
 * If the request fails, it logs an error.
 *
 * @param {string} templatesUrl - The URL for the collection of diagram templates.
 * @returns {Promise<Object|void>} A promise that resolves with the templates data if successful, 
 * or logs an error if the request fails.
 */
async function getDiagramTemplates(templatesUrl) {
    try {
    const templates = await makeEsriRequest(templatesUrl);
    // console.log("Diagrams Templates", templates);
    return templates;
    } catch (error) {
    console.error("Failed to load Diagrams Templates:", error);
    }
}



/**
 * Fetches network diagram information by making requests to the provided server URL.
 * It requests diagram data and diagram templates from the server and returns the templates.
 * If the requests fail, it logs an error.
 *
 * @param {string} networkDiagramServerUrl - The base URL for the network diagram server.
 * @returns {Promise<Object|void>} A promise that resolves with the diagram templates data if successful,
 * or logs an error if any of the requests fail.
 */
export async function getNetworkDiagramInfos(networkDiagramServerUrl) {

    let diagramsUrl = networkDiagramServerUrl + "/diagrams";
    let templatesUrl = networkDiagramServerUrl + "/templates";

    requestNetworkDiagramServer(networkDiagramServerUrl);
    getDiagrams(diagramsUrl);
    const diagramTemplates = getDiagramTemplates(templatesUrl)

return diagramTemplates
}
 export function generateTokenFromPortal(tokenUrl, username, password) {
    let postJson = {
      username: username,
      password: password,
      referer: window.location.href,
      expiration: 60,
      f: "json"
    }
    return new Promise((resolve, reject) => this.makeRequest({ method: 'POST', url: tokenUrl, params: postJson }).then((response) => {
      if (response.token !== undefined) {
        let token = response.token;
        resolve(token);
      }
      else
        reject("Invalid token")
    }).catch(rejected => reject("Fail to execute request")));
  }