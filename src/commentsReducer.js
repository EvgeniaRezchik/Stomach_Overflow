import axios from "axios";
const defaultState = {
  comments: [],
  error: ""
};
const commentsReducer = function(state=defaultState, action) {
  switch (action.type) {
    case "getComments":
      return {
        ...state,
        comments: action.payload.comments
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
const getComments = function(payload) {
  const dispatching = async function(dispatch) {
    try {
      let postId;
      if (payload.params) {
        for (let [key, value] of Object.entries(payload.params)) {
          if (key === "postId")
            postId = value;
        }
      }
      const commentsRes = await axios.get(`http://localhost:65535/api/posts/${postId}/comments`);
      if (commentsRes.data.comments.length > 0) {
        for (let i = 0; i < commentsRes.data.comments.length; i += 1) {
          const commentAuthorRes = await axios.get("http://localhost:65535/api/users/" + commentsRes.data.comments[i].author_id);
          commentsRes.data.comments[i].author = commentAuthorRes.data.user;
          if (commentsRes.data.comments[i].comment_id !== null) {
            for (let j of commentsRes.data.comments) {
              if (j.id === commentsRes.data.comments[i].comment_id) {
                commentsRes.data.comments[i].parentAuthor = j.author.login;
                break;
              }
            }
          }
          const childCommentsRes = await axios.get(`http://localhost:65535/api/comments/${commentsRes.data.comments[i].id}/comments`);
          commentsRes.data.comments[i].commentsCount = childCommentsRes.data.comments.length;
          const commentLikesRes = await axios.get("http://localhost:65535/api/comments/" + commentsRes.data.comments[i].id + "/like");
          let commentDislikesCount = 0;
          let commentLikesCount = 0;
          for (let i of commentLikesRes.data.likes) {
            if (i.type === "like")
              commentLikesCount += 1;
            else
              commentDislikesCount += 1;
          }
          commentsRes.data.comments[i].likesCount = commentLikesCount;
          commentsRes.data.comments[i].dislikesCount = commentDislikesCount;
        }
      }
      dispatch({
        type: "getComments",
        payload: {
          ...payload,
          comments: commentsRes.data.comments
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
export default commentsReducer;
export { getComments };
 
