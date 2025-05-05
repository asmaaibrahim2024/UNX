import "./BookMark.scss";
import React, { useEffect, useState, useRef } from "react";

import restHelper from "../../../handlers/RestHandler";


import { useDispatch, useSelector } from "react-redux";

import {
  initiateBookMarkWidget,
  createBookMarkObject,
} from "../../../handlers/esriHandler";

import {
  fillBookmarks,
} from "../../../redux/widgets/bookMark/bookMarkAction";
import SweetAlert from "../../../shared/uiControls/swalHelper/SwalHelper";
export default function BookMark({ isVisible, container }) {
  const dispatch = useDispatch();

  const [uniqueId] = useState('bookmark-map-tool-container');


  const mapView = useSelector((state) => state.mapViewReducer.intialView);
  const allBookmarksFromDB = useSelector((state) => state.bookMarkReducer.bookmarkList);
  const _bookmarkFilterTextSelector = useSelector((state)=>state.bookMarkReducer.bookmarkFilterText);
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  let bookMarkWG;
  let handle;
  const [bookMarkWidget, setBookMarkWidget] = useState(null);
  useEffect(() => {
   // console.log(mapView.map);
    
    if (!mapView?.map || isInitialized.current) return;

    const initializeBookmarksWidget = async () => {
      try {
        const initialBookmarks = await fetchBookmarksFromDatabase();

        bookMarkWG = await initiateBookMarkWidget(
          mapView,
          uniqueId,
          initialBookmarks
        );
        console.log("BookMark Widget:", bookMarkWG);
        //!old
        // setTimeout(() => {
        //   addDeleteBtn(bookMarkWG);
        // }, 700);
        //!new
        await waitForBookmarksRender();
addDeleteBtn(bookMarkWG);
        handle = bookMarkWG.bookmarks.on("change", function (evt) {
          evt.added.forEach(function (e) {
            const viewpointJSON = JSON.stringify(e.viewpoint);
            const parsedViewPoint = JSON.parse(viewpointJSON);
            parsedViewPoint.targetGeometry.type = `${e.viewpoint.targetGeometry.type}`;
            const modifiedViewPointJSON = JSON.stringify(parsedViewPoint);

            const newBookmark = {
              Name: e.name,
              MapThumbnail: e.thumbnail.url,
              userId:1,
              MapExtent: modifiedViewPointJSON,
              timeExtent: {
                start: new Date(),
                end: new Date(),
              },
            };
            newBookmark &&
              saveBookmarkToDatabase(newBookmark).then(async (ressss) => {
                console.log(ressss,"ressss");
                
                fetchBookmarksFromDatabase(bookMarkWG).then((res) => {
                  populateBookmarks(res, bookMarkWG);
                });
              });
          });
        });

        const htmlContentEdit = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_edit img"></span>
                                </div>
                                <h2 class="title_main">("Edited!")</h2>
                                <h2 class="title">(
                                  "Are you sure you want to save the edits?"
                                )</h2>
                            </div>`;

        bookMarkWG.on("bookmark-edit", async function (event) {

          SweetAlert(
            "40rem", // Width
            "", // Title
            "", // Title class
            htmlContentEdit, // HTML text
            true, // Show confirm button
            `("Save")`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `("Cancel")`, // Cancel button text
            "btn btn-outline-secondary", // Cancel button class
            false, // Show close button
            "", // Close button class
            "", // Additional text
            "", // Icon
            "", // Container class
            "", // Popup class
            "", // Header class
            "", // Icon class
            "", // Image class
            "", // HTML container class
            "", // Input class
            "", // Input label class
            "", // Validation message class
            "", // Actions class
            "", // Deny button class
            "", // Loader class
            "", // Footer class
            "", // Timer progress bar class
            "",
            false,
            async () => {
              // Confirm callback
              const viewpointJSON = JSON.stringify(event.bookmark.viewpoint);
              const parsedViewPoint = JSON.parse(viewpointJSON);
              parsedViewPoint.targetGeometry.type = `${event.bookmark.viewpoint.targetGeometry.type}`;
              const modifiedViewPointJSON = JSON.stringify(parsedViewPoint);
              //!old
              // const creationDate =
              //   event.bookmark.timeExtent.start.toISOString();
              //!new
              const creationDate = new Date().toISOString();
              
                debugger
              const updatedBookmark = {
                Id: event.bookmark.newid,
                Name: event.bookmark.name,
                MapThumbnail: event.bookmark.thumbnail.url,
                MapExtent: modifiedViewPointJSON,
                creationDate: creationDate,
              };
              await updateBookmarkInDatabase(updatedBookmark).then(async () => {
                fetchBookmarksFromDatabase(bookMarkWG).then((res) => {
                  bookMarkWG.bookmarks.items.splice(
                    0,
                    bookMarkWG.bookmarks.items.length
                  );
                  populateBookmarks(res, bookMarkWG);
                });
              });
            },
            () => {
              // Cancel callback
              fetchBookmarksFromDatabase(bookMarkWG).then((res) => {
                bookMarkWG.bookmarks.items.splice(
                  0,
                  bookMarkWG.bookmarks.items.length
                );
                populateBookmarks(res, bookMarkWG);
              });
            }
          );
        });


        bookMarkWG && setBookMarkWidget(bookMarkWG);

        isInitialized.current = true; // Mark as initialized
      } catch (error) {
        console.error("Error initializing bookmarksWidget:", error);
      }
    };

    initializeBookmarksWidget();
    return () => {
      if (handle) {
        handle.remove();
      }
      bookMarkWG.bookmarks.items = [];
      bookMarkWG.bookmarks.items.splice(0, bookMarkWG.bookmarks.items.length);
      bookMarkWG = null;
    };
  }, [mapView]);
//!hashed for now
  // useEffect(() => {
  //   const filterBookMarks = async (data) => {
  //     await populateBookmarks(data, bookMarkWidget);
  //   };
  //   if (
  //     _bookmarkFilterTextSelector != "" &&
  //     allBookmarksFromDB?.length > 0 &&
  //     bookMarkWidget
  //   ) {
  //     const filteredData = allBookmarksFromDB.filter((item) =>
  //       item.name
  //         .toLowerCase()
  //         .includes(_bookmarkFilterTextSelector.toLowerCase())
  //     );
  //     filterBookMarks(filteredData);
  //   } else if (_bookmarkFilterTextSelector == "") {
  //     filterBookMarks(allBookmarksFromDB);
  //   }
  // }, [allBookmarksFromDB, _bookmarkFilterTextSelector, bookMarkWidget]);
  //!not used
  // useEffect(()=>{
  //   if (isCancelClicked) {
  //     fetchBookmarksFromDatabase(bookMarkWidget).then((res) => {
  //       bookMarkWidget.bookmarks.items.splice(
  //         0,
  //         bookMarkWidget.bookmarks.items.length
  //       );
  //       populateBookmarks(res,bookMarkWidget);
  //       setIsCancelClicked(false)
  //     });
  //   }
  // },[isCancelClicked,bookMarkWidget])
  async function populateBookmarks(res, bookmarksWidget) {
    if(bookmarksWidget){

      bookmarksWidget.bookmarks.items = [];
      bookmarksWidget.bookmarks.items.splice(
        0,
        bookmarksWidget.bookmarks.items.length
      );
    }
    const newItems = [];
    for (const bookmark of res) {
      const MapExtent = JSON.parse(bookmark.mapExtent);
      const bookmarkObject = await createBookMarkObject(bookmark, MapExtent);
      newItems.push(bookmarkObject);
    }
    newItems.forEach((item) => {
      bookmarksWidget.bookmarks.items.push(item);
    });
    //!old
    // setTimeout(() => {
    //   addDeleteBtn(bookmarksWidget);
    // }, 700);
    //!new
    await waitForBookmarksRender();
addDeleteBtn(bookmarksWidget);
  }
  useEffect(() => {
    // Define a function to check for the element
    const checkForParentList = () => {
      const parent = document.getElementsByClassName(
        "esri-bookmarks__authoring-actions"
      )[0];
      if (parent) {
        const cancelButton = parent.querySelector('input[value="إلغاء"]');
        if (cancelButton) {
          cancelButton.addEventListener("click", async (event) => {
            // Your logic when cancel button is clicked
           fetchBookmarksFromDatabase(bookMarkWG).then((res) => {
             bookMarkWG.bookmarks.items.splice(
               0,
               bookMarkWG.bookmarks.items.length
             );
             populateBookmarks(res,bookMarkWG);
           });
          });
        } else {
          console.log("Cancel button not found");
        }
      } else {
        console.log("Parent element not found");
      }
    };
  
    // Create a MutationObserver to observe changes in the DOM
    const observer = new MutationObserver(() => {
      checkForParentList(); // Run the function when DOM changes
    });
  
    // Start observing the document for any changes
    observer.observe(document.body, {
      childList: true, // Look for added/removed child nodes
      subtree: true,   // Look through the entire subtree
    });
  
    // Clean up the observer when the component is unmounted
    return () => {
      observer.disconnect();
    };
  }, []);
  
  function waitForBookmarksRender(timeout = 2000) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const bookmarksList = document.querySelector(".esri-bookmarks__list");
        if (bookmarksList && bookmarksList.querySelectorAll("li").length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
  
      setTimeout(() => {
        clearInterval(interval);
        resolve(); // fallback to avoid indefinite wait
      }, timeout);
    });
  }

  const saveBookmarkToDatabase = async (bookmark) => {
    try {
   await restHelper.postRequest(
        `${window.appConfig.apiServer.apiUrl}BookMarks/AddBookmark`,
        bookmark
      );
    } catch (error) {
      console.error("Error saving bookmark:", error);
    }
  };

  const updateBookmarkInDatabase = async (bookmark) => {
    try {
       await restHelper.putRequest(
        `${window.appConfig.apiServer.apiUrl}BookMarks/UpdateBookmark`,
        bookmark
      );
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const fetchBookmarksFromDatabase = async () => {
    try {
      const response = await restHelper.getRequest(
        `${window.appConfig.apiServer.apiUrl}BookMarks/GetAllBookmarks`
      );
      
      console.log(response,"response");
      
      response?.data && setIsLoading(false);
      response?.data && dispatch(fillBookmarks(response.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching bookmarksWidget:", error);
      return [];
    }
  };
//!old
  // async function addDeleteBtn(bookmarksWidget) {
  //   const bookmarksElementsList = document.querySelector(
  //     ".esri-bookmarks__list"
  //   );
  //   if (bookmarksElementsList) {
  //     const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
  //     bookmarkItems.forEach(function (bookmarkItem) {
  //       const deleteButton = document.createElement("button");
  //       deleteButton.classList.add(
  //         "esri-bookmarks__bookmark-delete-button",
  //         "esri-icon-trash"
  //       );
  //       deleteButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;

  //       deleteButton.addEventListener("click", async (event) => {
  //         let bookMarkId = bookmarksWidget.bookmarks.filter(
  //           (c) => c.uid == event.target.id
  //         ).items[0].newid;

  //         const htmlContentDelete = `<div class="htmlContent">
  //                               <div class="icon_container icon_container_image nx_scale">
  //                                   <span class="bookmark_icon_delete img"></span>
  //                               </div>
  //                               <h2 class="title_main">t("Deleted!")</h2>
  //                               <h2 class="title">(
  //                                 "Are you sure you want to delete the bookmark?"
  //                               )</h2>
  //                           </div>`;

  //         SweetAlert(
  //           "42rem", // Width
  //           "", // Title
  //           "", // Title class
  //           htmlContentDelete, // HTML content
  //           true, // Show confirm button
  //           `("Delete")`, // Confirm button text
  //           "btn btn-primary", // Confirm button class
  //           true, // Show cancel button
  //           `("Cancel")`, // Cancel button text
  //           "btn btn-outline-secondary", // Cancel button class
  //           false, // Show close button
  //           "", // Close button class
  //           "", // Additional text
  //           "", // Icon
  //           "", // Container class
  //           "", // Popup class
  //           "", // Header class
  //           "", // Icon class
  //           "", // Image class
  //           "", // HTML container class
  //           "", // Input class
  //           "", // Input label class
  //           "", // Validation message class
  //           "", // Actions class
  //           "", // Deny button class
  //           "", // Loader class
  //           "", // Footer class
  //           "", // Timer progress bar class
  //           "",
  //           false,
  //           async () => {
  //             // Confirm callback
  //             if (bookMarkId) {
  //               await deleteBookmarkFromDatabase(bookMarkId);
  //               const res = await fetchBookmarksFromDatabase(bookmarksWidget);
  //               bookmarksWidget.bookmarks.items =
  //                 bookmarksWidget.bookmarks.items.filter(
  //                   (c) => c.newid != bookMarkId
  //                 );
  //               await populateBookmarks(res, bookmarksWidget);
  //             }
  //           },
  //           () => {
  //             // Cancel callback
  //             // Action to take if the user cancels
  //             console.log("Deletion canceled");
  //           }
  //         );
  //       });

  //       const checkDeleteBtnExist = bookmarkItem.querySelector(
  //         ".esri-bookmarks__bookmark-delete-button"
  //       );

  //       if (!checkDeleteBtnExist || checkDeleteBtnExist === undefined) {
  //         bookmarkItem?.appendChild(deleteButton);
  //       }
  //     });
  //   }
  // }
  //!new
  async function addDeleteBtn(bookmarksWidget) {
    const observer = new MutationObserver(() => {
      const bookmarksElementsList = document.querySelector(".esri-bookmarks__list");
      if (bookmarksElementsList) {
        observer.disconnect(); // Stop observing once found
        const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
  
        bookmarkItems.forEach(function (bookmarkItem) {
          const deleteButton = document.createElement("button");
          deleteButton.classList.add(
            "esri-bookmarks__bookmark-delete-button",
            "esri-icon-trash"
          );
          deleteButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;
  
          deleteButton.addEventListener("click", async (event) => {
            let bookMarkId = bookmarksWidget.bookmarks.filter(
              (c) => c.uid == event.target.id
            ).items[0].newid;
  
            const htmlContentDelete = `<div class="htmlContent">
                                  <div class="icon_container icon_container_image nx_scale">
                                      <span class="bookmark_icon_delete img"></span>
                                  </div>
                                  <h2 class="title_main">t("Deleted!")</h2>
                                  <h2 class="title">(
                                    "Are you sure you want to delete the bookmark?"
                                  )</h2>
                              </div>`;
  
                 SweetAlert(
            "42rem", // Width
            "", // Title
            "", // Title class
            htmlContentDelete, // HTML content
            true, // Show confirm button
            `("Delete")`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `("Cancel")`, // Cancel button text
            "btn btn-outline-secondary", // Cancel button class
            false, // Show close button
            "", // Close button class
            "", // Additional text
            "", // Icon
            "", // Container class
            "", // Popup class
            "", // Header class
            "", // Icon class
            "", // Image class
            "", // HTML container class
            "", // Input class
            "", // Input label class
            "", // Validation message class
            "", // Actions class
            "", // Deny button class
            "", // Loader class
            "", // Footer class
            "", // Timer progress bar class
            "",
            false,
            async () => {
              // Confirm callback
              if (bookMarkId) {
                await deleteBookmarkFromDatabase(bookMarkId);
                const res = await fetchBookmarksFromDatabase(bookmarksWidget);
                bookmarksWidget.bookmarks.items =
                  bookmarksWidget.bookmarks.items.filter(
                    (c) => c.newid != bookMarkId
                  );
                await populateBookmarks(res, bookmarksWidget);
              }
            },
            () => {
              // Cancel callback
              // Action to take if the user cancels
              console.log("Deletion canceled");
            }
          );
    
          });
  
          const checkDeleteBtnExist = bookmarkItem.querySelector(
            ".esri-bookmarks__bookmark-delete-button"
          );
          if (!checkDeleteBtnExist) {
            bookmarkItem.appendChild(deleteButton);
          }
        });
      }
    });
  
    // Start observing body for changes (you can narrow this down if you want)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  
  const deleteBookmarkFromDatabase = async (bookmarkId) => {
    try {
      if (bookmarkId) {
        await restHelper.deleteRequest(
          `${window.appConfig.apiServer.apiUrl}BookMarks/DeleteBookmark/${bookmarkId}`
        );
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };
  if (!isVisible) return null;

  return (isVisible &&(
    <div className={`bookmark-tool-container`}>
    <div id={uniqueId}></div>
  </div>
  )

  
    
  )
};


