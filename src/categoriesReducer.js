import axios from "axios";
const defaultState = {
  categories: [],
  queries: {},
  pages: 0,
  page: 0,
  error: ""
};
const categoriesReducer = function(state=defaultState, action) {
  switch (action.type) {
    case "getCategories":
      return {
        ...state,
        categories: action.payload.categories,
        queries: action.payload.queries,
        pages: action.payload.pages,
        page: action.payload.page
      };
    case "error":
      return {
        ...state,
        error: action.payload.error
      };
    default:
      return state;
  }
}
const getCategories = function(payload) {
  const dispatching = async function(dispatch) {
    try {
      let queries = "";
      if (payload.params) {
        for (let [key, value] of Object.entries(payload.params)) {
          if (value instanceof Array && value.length > 0) {
            queries += (queries === "" ? "?":"&") + `${key}=${value[0]}`;
            for (let i = 1; i < value.length; i += 1)
              queries += `&${key}=${value[i]}`;
          } else
            queries += (queries === "" ? "?":"&") + `${key}=${value}`;
        }
      }
      const categoriesRes = await axios.get("http://localhost:65535/api/categories" + queries);
      dispatch({
        type: "getCategories",
        payload: {
          ...payload,
          categories: categoriesRes.data.categories,
          pages: categoriesRes.data.pages,
          page: categoriesRes.data.page
        }
      });
    } catch(err) {
      dispatch({
        type: "error",
        payload: {
          ...payload,
          error: err?.response?.data?.message || "Something went wrong"
        }
      });
    }
  }
  return dispatching;
}
export default categoriesReducer;
export { getCategories };
 
