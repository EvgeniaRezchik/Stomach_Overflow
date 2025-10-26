import axios from "axios";
const defaultState = {
  users: [],
  queries: {},
  pages: 0,
  page: 0,
  error: ""
};
const usersReducer = function(state=defaultState, action) {
  switch (action.type) {
    case "getUsers":
      return {
        ...state,
        users: action.payload.users,
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
const getUsers = function(payload) {
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
      const usersRes = await axios.get("http://localhost:65535/api/users" + queries);
      dispatch({
        type: "getUsers",
        payload: {
          ...payload,
          users: usersRes.data.users,
          pages: usersRes.data.pages,
          page: usersRes.data.page
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
export default usersReducer;
export { getUsers };
 
