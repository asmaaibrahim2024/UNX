import { applyMiddleware, combineReducers, compose, createStore } from "redux";

import rootReducer from './index';

const store = createStore(rootReducer);
export default store;

