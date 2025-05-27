import "./BookMark.scss";
import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "../../../handlers/languageHandler";

import restHelper from "../../../handlers/RestHandler";
import { interceptor } from "../../../handlers/authHandlers/tokenInterceptorHandler";
import { ProgressSpinner } from "primereact/progressspinner";

import { useDispatch, useSelector } from "react-redux";

import {
  initiateBookMarkWidget,
  createBookMarkObject,
  showSuccessToast,
  showErrorToast,
} from "../../../handlers/esriHandler";

import { fillBookmarks } from "../../../redux/widgets/bookMark/bookMarkAction";
import SweetAlert from "../../../shared/uiControls/swalHelper/SwalHelper";

import close from "../../../style/images/x-close.svg";
import bookmark from "../../../style/images/bookmark.svg";
import edit from "../../../style/images/edit-pen.svg";
import { useTranslation } from "react-i18next";

export default function BookMark({ containerRef, onclose }) {
  const dispatch = useDispatch();
  const { t, direction } = useI18n("BookMark");
  const { i18n } = useTranslation("BookMark");

  const [uniqueId] = useState("bookmark-map-tool-container");

  const mapView = useSelector((state) => state.mapViewReducer.intialView);
  const allBookmarksFromDB = useSelector(
    (state) => state.bookMarkReducer.bookmarkList
  );
  const allBookmarksRef = useRef(allBookmarksFromDB);
  const _bookmarkFilterTextSelector = useSelector(
    (state) => state.bookMarkReducer.bookmarkFilterText
  );
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  // let bookMarkWG;
  const bookMarkWGRef = useRef(null);
  let handle;
  const [bookMarkWidget, setBookMarkWidget] = useState(null);

  const descriptionRef = useRef("");

  // to change the buttons titles when the language changes
  i18n.on("languageChanged", () => {
    updateBookmarkButtonTitles();
    changeDescriptionPlaceholderOnLanguageChange();
  });

  const changeDescriptionPlaceholderOnLanguageChange = () => {
    const textarea = document.querySelector(".custom-description textarea");
    if (textarea) textarea.placeholder = t("Enter a description");
  };

  // Update the ref whenever allBookmarksFromDB changes
  useEffect(() => {
    allBookmarksRef.current = allBookmarksFromDB;
  }, [allBookmarksFromDB]);

  useEffect(() => {
    // console.log(mapView.map);

    if (!mapView?.map || isInitialized.current) return;

    const initializeBookmarksWidget = async () => {
      try {
        const initialBookmarks = await fetchBookmarksFromDatabase();

        dispatch(fillBookmarks(initialBookmarks));

        const wg = await initiateBookMarkWidget(
          mapView,
          uniqueId,
          initialBookmarks
        );

        bookMarkWGRef.current = wg;
        // console.log("BookMark Widget:", bookMarkWGRef.current);
        //!old
        setTimeout(() => {
          addDeleteBtn(bookMarkWGRef.current);
          addShareBtn(bookMarkWGRef.current);
          addInfoBtn(bookMarkWGRef.current);
          changeTooltipForEditButton();
          addTooltipForlabel(bookMarkWGRef.current);
        }, 700);
        //!new
        //         await waitForBookmarksRender();
        // addDeleteBtn(bookMarkWG);

        const checkIfBookmarkExistsBeforeAdding = (e) => {
          const isDuplicate = allBookmarksRef.current.some(
            (bm) => bm.name.trim().toLowerCase() === e.name.trim().toLowerCase()
          );

          if (isDuplicate) {
            // Remove the added duplicate from the widget
            const index = bookMarkWGRef.current.bookmarks.items.findIndex(
              (item) => item.name === e.name
            );
            if (index !== -1) {
              bookMarkWGRef.current.bookmarks.items.splice(index, 1);
            }

            showErrorToast(t("A bookmark with this title already exists."));
            return true;
          }
          return false;
        };

        const checkBookmrkTitleExceedsLengthBeforeAdding = (title) => {
          console.log(window.bookMarkConfig.max_title_length);
          if (title.length > window.bookMarkConfig.max_title_length) {
            showErrorToast(
              t(
                `The bookmark title cannot be longer than ${window.bookMarkConfig.max_title_length} characters.`
              )
            );
            return true;
          }
          return false;
        };

        handle = bookMarkWGRef.current.bookmarks.on("change", function (evt) {
          evt.added.forEach(function (e) {
            if (checkIfBookmarkExistsBeforeAdding(e)) return;
            if (checkBookmrkTitleExceedsLengthBeforeAdding(e.name)) return;

            const viewpointJSON = JSON.stringify(e.viewpoint);
            const parsedViewPoint = JSON.parse(viewpointJSON);
            parsedViewPoint.targetGeometry.type = `${e.viewpoint.targetGeometry.type}`;
            const modifiedViewPointJSON = JSON.stringify(parsedViewPoint);

            const newBookmark = {
              Name: e.name,
              Description: descriptionRef.current,
              MapThumbnail: e.thumbnail.url,
              MapExtent: modifiedViewPointJSON,
              timeExtent: {
                start: new Date(),
                end: new Date(),
              },
            };
            newBookmark &&
              saveBookmarkToDatabase(newBookmark).then(async (ressss) => {
                // console.log(ressss, "ressss");

                fetchBookmarksFromDatabase(bookMarkWGRef.current).then(
                  (res) => {
                    dispatch(fillBookmarks(res));
                    populateBookmarks(res, bookMarkWGRef.current);
                  }
                );
              });
          });
        });

        const checkIfBookmarkExistsBeforeEditing = async (event) => {
          const bookmarkItem = event.bookmark;
          const originalBookmark = allBookmarksRef.current.find(
            (bm) => bm.id === bookmarkItem.newid
          );

          // ✅ DUPLICATE CHECK (excluding the current bookmark being edited)
          const editedName = event.bookmark.name.trim().toLowerCase();
          const isDuplicate = allBookmarksRef.current.some(
            (bm) =>
              bm.name.trim().toLowerCase() === editedName &&
              bm.id !== event.bookmark.newid // exclude current bookmark
          );

          if (isDuplicate) {
            showErrorToast(t("A bookmark with this title already exists."));
            // 🔁 Force reset of the bookmark in the widget
            fetchBookmarksFromDatabase(bookMarkWGRef.current).then((res) => {
              bookMarkWGRef.current.bookmarks.items.splice(
                0,
                bookMarkWGRef.current.bookmarks.items.length
              );
              dispatch(fillBookmarks(res));
              populateBookmarks(res, bookMarkWGRef.current);
            });

            return true;
          }
          return false;
        };

        const checkBookmrkTitleExceedsLengthBeforeEditing = async (title) => {
          if (title.length > window.bookMarkConfig.max_title_length) {
            showErrorToast(
              t(
                `The bookmark title cannot be longer than ${window.bookMarkConfig.max_title_length} characters.`
              )
            );

            // 🔁 Force reset of the bookmark in the widget
            fetchBookmarksFromDatabase(bookMarkWGRef.current).then((res) => {
              bookMarkWGRef.current.bookmarks.items.splice(
                0,
                bookMarkWGRef.current.bookmarks.items.length
              );
              dispatch(fillBookmarks(res));
              populateBookmarks(res, bookMarkWGRef.current);
            });
            return true;
          }
          return false;
        };

        bookMarkWGRef.current.on("bookmark-edit", async function (event) {
          console.log(event);
          if (await checkIfBookmarkExistsBeforeEditing(event)) return;
          if (
            await checkBookmrkTitleExceedsLengthBeforeEditing(
              event.bookmark.name
            )
          )
            return;

          const htmlContentEdit = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_edit img"></span>
                                </div>
                                <h2 class="title_main">${t("Edited!")}</h2>
                                <h2 class="title">${t(
                                  "Are you sure you want to save the edits?"
                                )}</h2>
                            </div>`;
          SweetAlert(
            "30rem", // Width
            "", // Title
            "", // Title class
            htmlContentEdit, // HTML text
            true, // Show confirm button
            `${t("Save")}`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `${t("Cancel")}`, // Cancel button text
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

              // debugger
              const updatedBookmark = {
                id: event.bookmark.newid,
                Name: event.bookmark.name,
                Description: descriptionRef.current,
                MapThumbnail: event.bookmark.thumbnail.url,
                MapExtent: modifiedViewPointJSON,
                creationDate: creationDate,
              };
              // console.log(updatedBookmark);
              await updateBookmarkInDatabase(updatedBookmark).then(async () => {
                fetchBookmarksFromDatabase(bookMarkWGRef.current).then(
                  (res) => {
                    bookMarkWGRef.current.bookmarks.items.splice(
                      0,
                      bookMarkWGRef.current.bookmarks.items.length
                    );
                    dispatch(fillBookmarks(res));
                    populateBookmarks(res, bookMarkWGRef.current);
                  }
                );
              });
            },
            () => {
              // Cancel callback
              fetchBookmarksFromDatabase(bookMarkWGRef.current).then((res) => {
                bookMarkWGRef.current.bookmarks.items.splice(
                  0,
                  bookMarkWGRef.current.bookmarks.items.length
                );
                populateBookmarks(res, bookMarkWGRef.current);
              });
            }
          );
        });

        bookMarkWGRef.current && setBookMarkWidget(bookMarkWGRef.current);

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
      bookMarkWGRef.current.bookmarks.items = [];
      bookMarkWGRef.current.bookmarks.items.splice(
        0,
        bookMarkWGRef.current.bookmarks.items.length
      );
      bookMarkWGRef.current = null;
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
    if (bookmarksWidget) {
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
    setTimeout(() => {
      addDeleteBtn(bookmarksWidget);
      addShareBtn(bookmarksWidget);
      addInfoBtn(bookmarksWidget);
      changeTooltipForEditButton();
      addTooltipForlabel(bookmarksWidget);
    }, 700);
    //!new
    //     await waitForBookmarksRender();
    // addDeleteBtn(bookmarksWidget);
  }
  useEffect(() => {
    // Define a function to check for the element
    const checkForParentList = () => {
      const parent = document.getElementsByClassName(
        "esri-bookmarks__authoring-actions"
      )[0];

      checkIfInputIsSpaces(parent);
      if (parent) {
        const cancelButton = parent.querySelector(
          'input.esri-button.esri-button--tertiary[type="button"]:not(.esri-bookmarks__authoring-delete-button)'
        );
        if (cancelButton) {
          // console.log(cancelButton);
          cancelButton.addEventListener("click", async (event) => {
            // console.log(bookMarkWGRef.current);
            // Your logic when cancel button is clicked
            fetchBookmarksFromDatabase(bookMarkWGRef.current).then((res) => {
              bookMarkWGRef.current.bookmarks.items.splice(
                0,
                bookMarkWGRef.current.bookmarks.items.length
              );
              // console.log("test1");
              dispatch(fillBookmarks(res));
              populateBookmarks(res, bookMarkWGRef.current);
              // addDeleteBtn(bookMarkWG)
              // addShareBtn()
            });
          });
        } else {
          console.log("Cancel button not found");
        }
      } else {
        console.log("Parent element not found");
      }
    };

    const addDescriptionInput = (form) => {
      // Find the label containing the title input
      const titleLabel = form.querySelector(".esri-bookmarks__authoring-label");

      const container = form.querySelector(
        ".esri-bookmarks__authoring-container"
      );

      if (container) container.style.flexWrap = "wrap";

      if (titleLabel) {
        // Create a new label and input for the description
        const descriptionLabel = document.createElement("label");
        descriptionLabel.className =
          "esri-bookmarks__authoring-label custom-description";
        descriptionLabel.style.display = "flex"; // match style if needed
        descriptionLabel.textContent = "Description";

        // Create the input element
        const descriptionInput = document.createElement("textarea");
        // descriptionInput.type = "text";
        descriptionInput.className = "esri-input";
        descriptionInput.placeholder = t("Enter a description");
        descriptionInput.required = false;

        // ✅ Try to match bookmark by title name to get existing description
        const titleInput = titleLabel.querySelector("input");
        if (titleInput) {
          const existingBookmark = allBookmarksFromDB.find(
            (b) =>
              b.name?.trim().toLowerCase() ===
              titleInput.value?.trim().toLowerCase()
          );

          if (existingBookmark?.description) {
            descriptionInput.value = existingBookmark.description;
            descriptionRef.current = existingBookmark.description;
          }
        }

        // ✅ Listen to input events and update React state
        descriptionInput.addEventListener("input", (e) => {
          descriptionRef.current = e.target.value; // <--- React state updated live
        });

        // Append the input to the label
        descriptionLabel.appendChild(descriptionInput);

        // Insert the new label/input after the existing title label
        titleLabel.parentNode.insertBefore(
          descriptionLabel,
          titleLabel.nextSibling
        );
      } else {
        console.log("Title Label element not found");
      }
    };

    // Create a MutationObserver to observe changes in the DOM
    const observer = new MutationObserver(() => {
      const form = document.querySelector(".esri-bookmarks__authoring-form");

      if (form && !form.querySelector(".custom-description")) {
        checkForParentList(); // Run the function when DOM changes

        addDescriptionInput(form);
      }
    });

    // Start observing the document for any changes
    observer.observe(document.body, {
      childList: true, // Look for added/removed child nodes
      subtree: true, // Look through the entire subtree
    });

    // Clean up the observer when the component is unmounted
    return () => {
      observer.disconnect();
    };
  }, [allBookmarksFromDB]);

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
      await interceptor.postRequest(`api/BookMarks/AddBookmark`, bookmark);
    } catch (error) {
      console.error("Error saving bookmark:", error);
    }
  };

  const updateBookmarkInDatabase = async (bookmark) => {
    try {
      await interceptor.putRequest(`api/BookMarks/UpdateBookmark`, bookmark);
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const fetchBookmarksFromDatabase = async () => {
    try {
      // const response = await restHelper.getRequest(
      //   `${window.appConfig.apiServer.apiUrl}BookMarks/GetAllBookmarks`
      // );
      const response = await interceptor.getRequest(
        `api/BookMarks/GetAllBookmarks`
      );
      // console.log(response, "response");

      response && setIsLoading(false);
      response && dispatch(fillBookmarks(response));
      return response;
    } catch (error) {
      console.error("Error fetching bookmarksWidget:", error);
      return [];
    }
  };
  //!old
  async function addDeleteBtn(bookmarksWidget) {
    const bookmarksElementsList = document.querySelector(
      ".esri-bookmarks__list"
    );
    if (bookmarksElementsList) {
      const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
      bookmarkItems.forEach(function (bookmarkItem) {
        const deleteButton = document.createElement("button");
        deleteButton.classList.add(
          "esri-bookmarks__bookmark-delete-button"
          // "esri-icon-trash"
        );
        // const deleteButtonImg = document.createElement("img");
        // deleteButtonImg.src = trash;
        // deleteButtonImg.height = 16;
        // deleteButtonImg.className = "";
        deleteButton.title = t("Delete");
        // deleteButton.appendChild(deleteButtonImg);

        deleteButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;

        deleteButton.addEventListener("click", async (event) => {
          //deleteButton.classList.add("selected");

          let bookMarkId = bookmarksWidget.bookmarks.filter(
            (c) => c.uid == event.target.id
          ).items[0].newid;

          const htmlContentDelete = `<div class="htmlContent">
                                <div class="icon_container icon_container_image nx_scale">
                                    <span class="bookmark_icon_delete img"></span>
                                </div>
                                <h2 class="title_main">${t("Deleted!")}</h2>
                                <h2 class="title">${t(
                                  "Are you sure you want to delete the bookmark?"
                                )}</h2>
                            </div>`;

          SweetAlert(
            "30rem", // Width
            "", // Title
            "", // Title class
            htmlContentDelete, // HTML content
            true, // Show confirm button
            `${t("Delete")}`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `${t("Cancel")}`, // Cancel button text
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

                dispatch(fillBookmarks(res));
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

        if (!checkDeleteBtnExist || checkDeleteBtnExist === undefined) {
          bookmarkItem?.appendChild(deleteButton);
        }
      });
    }
  }

  async function addShareBtn(bookmarksWidget) {
    const bookmarksElementsList = document.querySelector(
      ".esri-bookmarks__list"
    );
    if (bookmarksElementsList) {
      const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
      bookmarkItems.forEach(function (bookmarkItem) {
        const shareButton = document.createElement("button");
        shareButton.classList.add(
          "esri-bookmarks__bookmark-share-button"
          // "esri-icon-share"
        );
        shareButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;

        // const shareButtonImg = document.createElement("img");
        // shareButtonImg.src = share;
        // shareButtonImg.height = 16;
        // shareButtonImg.className = "";
        shareButton.title = t("Share");
        // shareButton.appendChild(shareButtonImg);

        shareButton.addEventListener("click", async (event) => {
          //shareButton.classList.add("selected");
          let bookMarkId = bookmarksWidget.bookmarks.filter(
            (c) => c.uid == event.target.id
          ).items[0].newid;

          const currentUrl = `${window.location.origin}${window.location.pathname}?bookmarkid=${bookMarkId}`;

          const htmlContentShare = `<div class="htmlContent">
    <div class="icon_container icon_container_image nx_scale">
        <span class="bookmark_icon_share img"></span>
    </div>
    <h2 class="title_main">${t("Share")}</h2>
    <h2 class="title">${t("Are you sure you want to share the bookmark?")}</h2>
    <p class="bookmark_link mt-3 mb-0">
        <a href="${currentUrl}" target="_blank">${currentUrl}</a>
    </p>
</div>`;

          SweetAlert(
            "30rem", // Width
            "", // Title
            "", // Title class
            htmlContentShare, // HTML content
            true, // Show confirm button
            `${t("Share")}`, // Confirm button text
            "btn btn-primary", // Confirm button class
            true, // Show cancel button
            `${t("Cancel")}`, // Cancel button text
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
                navigator.clipboard
                  .writeText(currentUrl)
                  .then(() => {
                    showSuccessToast(t("Link copied to clipboard!"));
                  })
                  .catch((err) => {
                    showErrorToast(`${t("Failed to copy: ")}${err}`);
                  });
              }
            },
            () => {
              // Cancel callback
              // Action to take if the user cancels
              console.log("Share canceled");
            }
          );
        });

        const checkShareBtnExist = bookmarkItem.querySelector(
          ".esri-bookmarks__bookmark-share-button"
        );

        if (!checkShareBtnExist || checkShareBtnExist === undefined) {
          bookmarkItem?.appendChild(shareButton);
        }
      });
    }
  }

  async function addInfoBtn(bookmarksWidget) {
    const bookmarksElementsList = document.querySelector(
      ".esri-bookmarks__list"
    );
    if (bookmarksElementsList) {
      const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
      bookmarkItems.forEach(function (bookmarkItem) {
        const infoButton = document.createElement("button");
        infoButton.classList.add("esri-bookmarks__bookmark-info-button");
        infoButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;

        // const infoButtonImg = document.createElement("img");
        // infoButtonImg.src = info;
        // infoButtonImg.height = 16;
        // infoButtonImg.className = "";
        infoButton.title = t("info");
        // infoButton.appendChild(infoButtonImg);

        infoButton.addEventListener("click", async (event) => {
          infoButton.classList.toggle("selected");
          let bookMarkId = bookmarksWidget.bookmarks.filter(
            (c) => c.uid == event.target.id
          ).items[0].newid;

          const bookmarkData = allBookmarksRef.current.find(
            (b) => b.id === bookMarkId
          );

          if (!bookmarkData) {
            console.error("Bookmark not found");
            return;
          }

          // Create proper DOM elements
          const infoContainer = document.createElement("div");
          infoContainer.className = "bookmark-info-container";
          if (infoButton.classList.contains("selected")) {
            infoContainer.classList.add("d-flex");
            infoContainer.classList.remove("d-none");
          } else {
            infoContainer.classList.remove("d-flex");
            infoContainer.classList.add("d-none");
          }

          const description = document.createElement("p");
          description.textContent = bookmarkData.description;

          // Clear previous content
          const existingInfo = bookmarkItem.querySelector(
            ".bookmark-info-container"
          );
          if (existingInfo) existingInfo.remove();

          // Add new content
          infoContainer.appendChild(description);
          bookmarkItem.appendChild(infoContainer);
        });
        const checkInfoBtnExist = bookmarkItem.querySelector(
          ".esri-bookmarks__bookmark-info-button"
        );

        if (!checkInfoBtnExist || checkInfoBtnExist === undefined) {
          bookmarkItem?.appendChild(infoButton);
        }
      });
    }
  }

  async function changeTooltipForEditButton() {
    const bookmarksElementsList = document.querySelector(
      ".esri-bookmarks__list"
    );
    if (bookmarksElementsList) {
      const bookmarkItems = bookmarksElementsList.querySelectorAll(
        ".esri-bookmarks__bookmark-edit-button"
      );
      bookmarkItems.forEach(function (bookmarkItem) {
        bookmarkItem.title = t("Edit");
      });
    }
  }

  async function addTooltipForlabel(bookmarksWidget) {
    const bookmarksElementsList = document.querySelector(
      ".esri-bookmarks__list"
    );
    if (bookmarksElementsList) {
      const bookmarkItems = bookmarksElementsList.querySelectorAll("li");
      bookmarkItems.forEach(function (bookmarkItem) {
        const titleHTML = bookmarkItem.querySelector(
          ".esri-bookmarks__bookmark-name"
        );
        let bookMarkId = bookmarksWidget.bookmarks.filter(
          (c) => c.uid == bookmarkItem.getAttribute("data-bookmark-uid")
        ).items[0].newid;

        const bookmarkData = allBookmarksRef.current.find(
          (b) => b.id === bookMarkId
        );

        if (!bookmarkData) {
          console.error("Bookmark not found");
          return;
        }
        titleHTML.title = bookmarkData.name;
      });
    }
  }

  const checkIfInputIsSpaces = (actionsButtons) => {
    const addButton = actionsButtons.querySelector(
      '.esri-button[type="Submit"]'
    );

    if (addButton) {
      addButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevents form submission if inside a form
        const titleInput = document.querySelector(".esri-input");
        const input = titleInput.innerHTML.trim();
        if (input === "") {
          showErrorToast(t("Please enter a valid title"));
        }
      });
    }
  };

  function updateBookmarkButtonTitles() {
    console.log("test");
    const deleteButtons = document.querySelectorAll(
      ".esri-bookmarks__bookmark-delete-button"
    );
    deleteButtons.forEach((btn) => (btn.title = t("Delete")));

    const shareButtons = document.querySelectorAll(
      ".esri-bookmarks__bookmark-share-button"
    );
    shareButtons.forEach((btn) => (btn.title = t("Share")));

    const infoButtons = document.querySelectorAll(
      ".esri-bookmarks__bookmark-info-button"
    );
    infoButtons.forEach((btn) => (btn.title = t("info")));
  }

  //!new
  // async function addDeleteBtn(bookmarksWidget) {
  //   const observer = new MutationObserver(() => {
  //     const bookmarksElementsList = document.querySelector(".esri-bookmarks__list");
  //     if (bookmarksElementsList) {
  //       observer.disconnect(); // Stop observing once found
  //       const bookmarkItems = bookmarksElementsList.querySelectorAll("li");

  //       bookmarkItems.forEach(function (bookmarkItem) {
  //         const deleteButton = document.createElement("button");
  //         deleteButton.classList.add(
  //           "esri-bookmarks__bookmark-delete-button",
  //           "esri-icon-trash"
  //         );
  //         deleteButton.id = bookmarkItem.attributes["data-bookmark-uid"].value;

  //         deleteButton.addEventListener("click", async (event) => {
  //           let bookMarkId = bookmarksWidget.bookmarks.filter(
  //             (c) => c.uid == event.target.id
  //           ).items[0].newid;

  //           const htmlContentDelete = `<div class="htmlContent">
  //                                 <div class="icon_container icon_container_image nx_scale">
  //                                     <span class="bookmark_icon_delete img"></span>
  //                                 </div>
  //                                 <h2 class="title_main">t("Deleted!")</h2>
  //                                 <h2 class="title">(
  //                                   "Are you sure you want to delete the bookmark?"
  //                                 )</h2>
  //                             </div>`;

  //                SweetAlert(
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

  //         });

  //         const checkDeleteBtnExist = bookmarkItem.querySelector(
  //           ".esri-bookmarks__bookmark-delete-button"
  //         );
  //         if (!checkDeleteBtnExist) {
  //           bookmarkItem.appendChild(deleteButton);
  //         }
  //       });
  //     }
  //   });

  //   // Start observing body for changes (you can narrow this down if you want)
  //   observer.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //   });
  // }

  const deleteBookmarkFromDatabase = async (bookmarkId) => {
    try {
      if (bookmarkId) {
        await interceptor.deleteRequest(
          `api/BookMarks/DeleteBookmark/${bookmarkId}`
        );
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  return (
    // isLoading?( (
    //             <div style={{ width: '20px', height: '20px' }}>
    //               <ProgressSpinner
    //                 style={{ width: '20px', height: '20px' }}
    //                 strokeWidth="4"
    //               />
    //             </div>
    //           )):(
    <div
      ref={containerRef}
      className="bookmark-tool-container sidebar_widget"
      style={{ display: "none" }}
    >
      <div className="sidebar_widget_header">
        <div className="header_title_container">
          <img src={bookmark} alt="bookmark" className="sidebar_widget_icon" />
          <span class="title">{t("bookmark")}</span>
        </div>
        <img
          src={close}
          alt="close"
          width="25"
          height="24"
          className="sidebar_widget_close"
          onClick={() => onclose()}
        />
      </div>
      <div className="sidebar_widget_body">
        <div id={uniqueId}></div>
      </div>
    </div>
    // )
  );
}
