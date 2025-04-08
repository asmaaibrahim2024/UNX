import { ActionTypes } from "../../constants/actionTypes";


export const fillBookmarks = (bookmarkList) => {
    return {
        type: ActionTypes.FILL_BOOKMARKS,
        payload: bookmarkList
    }
}
export const setBookmarkFilterText = (bookmarkFilterText) => {
    return {
        type: ActionTypes.BOOKMARK_FILTER_TEXT,
        payload: bookmarkFilterText
    }
}