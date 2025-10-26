import { createStore, combineReducers, applyMiddleware } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import { thunk } from "redux-thunk";
import postsReducer from "./postsReducer";
import categoriesReducer from "./categoriesReducer";
import notificationsReducer from "./notificationsReducer";
import commentsReducer from "./commentsReducer";
import usersReducer from "./usersReducer";
const generalReducer = combineReducers({
  posts: postsReducer,
  categories: categoriesReducer,
  notifications: notificationsReducer,
  comments: commentsReducer,
  users: usersReducer
});
const store = createStore(generalReducer, composeWithDevTools(applyMiddleware(thunk)));
export default store;

