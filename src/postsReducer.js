import axios from "axios";
const defaultState = {
  posts: [],
  queries: {},
  pages: 0,
  page: 0,
  error: ""
};
const postsReducer = function(state=defaultState, action) {
  switch (action.type) {
    case "getPosts":
      return {
        ...state,
        posts: action.payload.posts,
        authors: action.payload.authors,
        categories: action.payload.categories,
        /*commentsCount: action.payload.commentsCount,
        likesCount: action.payload.likesCount,
        dislikesCount: action.payload.dislikesCount,*/
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
const getPosts = function(payload) {
  const dispatching = async function(dispatch) {
    try {
      let queries = "";
      let token;
      if (payload.params) {
        for (let [key, value] of Object.entries(payload.params)) {
          if (key !== "token") {
            if (value instanceof Array && value.length > 0) {
              queries += (queries === "" ? "?":"&") + `${key}=${value[0]}`;
              for (let i = 1; i < value.length; i += 1)
                queries += `&${key}=${value[i]}`;
            } else
              queries += (queries === "" ? "?":"&") + `${key}=${value}`;
          } else
            token = value;
        }
      }
      const postsRes = await axios.get("http://localhost:65535/api/posts" + queries, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      if (postsRes.data.posts.length !== 0) {
        for (let i = 0; i < postsRes.data.posts.length; i += 1) {
          const authorRes = await axios.get("http://localhost:65535/api/users/" + postsRes.data.posts[i].author_id);
          postsRes.data.posts[i].author = authorRes.data.user;
          const categoriesRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/categories");
          postsRes.data.posts[i].categories = categoriesRes.data.categories;
          const commentsRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/comments");
          postsRes.data.posts[i].commentsCount = commentsRes.data.comments.length;
          const likesRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/like");
          let dislikesCount = 0;
          let likesCount = 0;
          for (let i of likesRes.data.likes) {
            if (i.type === "like")
              likesCount += 1;
            else
              dislikesCount += 1;
          }
          postsRes.data.posts[i].likesCount = likesCount;
          postsRes.data.posts[i].dislikesCount = dislikesCount;
        }
      }
      dispatch({
        type: "getPosts",
        payload: {
          ...payload,
          posts: postsRes.data.posts,
          pages: postsRes.data.pages,
          page: postsRes.data.page
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
export default postsReducer;
export { getPosts };
 
