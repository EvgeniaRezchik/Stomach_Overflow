import axios from "axios";
const defaultState = {
  notifications: [],
  error: ""
};
const notificationsReducer = function(state=defaultState, action) {
  switch (action.type) {
    case "getNotifications":
      return {
        ...state,
        notifications: action.payload.notifications
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
const getNotifications = function(payload) {
  const dispatching = async function(dispatch) {
    try {
      let token;
      if (payload.params) {
        for (let [key, value] of Object.entries(payload.params)) {
          if (key === "token")
            token = value;
        }
      }
      const notificationsRes = await axios.get("http://localhost:65535/api/notifications", {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      dispatch({
        type: "getNotifications",
        payload: {
          ...payload,
          notifications: notificationsRes.data.notifications
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
export default notificationsReducer;
export { getNotifications };
 
