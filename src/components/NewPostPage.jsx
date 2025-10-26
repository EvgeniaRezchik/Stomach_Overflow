import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import { getCategories } from "../categoriesReducer";
function NewPostPage(props) {
  const navigate = useNavigate();
  const {post_id} = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const categoriesSelector = useSelector(state => state.categories.categories);
  const categoriesErrorSelector = useSelector(state => state.categories.error);
  let token;
  if (document.cookie)
    token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
  useEffect(() => {
    async function checkValues() {
      try {
        if (!token) {
          setMessage("You are not authorized!");
          setTimeout(() => navigate("/"), 3000);
        }
        dispatch(getCategories({}));
        if (post_id) {
          const postRes = await axios.get(`http://localhost:65535/api/posts/${post_id}`);
          const categoriesRes = await axios.get(`http://localhost:65535/api/posts/${post_id}/categories`);
          let categoriesArray = [];
          setTitle(postRes.data.post.title);
          setContent(postRes.data.post.content);
          for (let i of categoriesRes.data.categories)
            categoriesArray.push(i.title);
          setCategories(categoriesArray);
        }
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
      }
    }
    checkValues();
  }, [dispatch, navigate, post_id, token]);
  useEffect(() => {
    if (categoriesErrorSelector) {
      setMessage(categoriesErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [categoriesErrorSelector, navigate]);
  const createPost = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:65535/api/posts", {
        title: title === "" ? undefined:title,
        content: content === "" ? undefined:content,
        categories: categories instanceof Array && categories.length === 0 ? undefined:categories
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      setTimeout(() => navigate(`/post/${res.data.postId}`), 3000);
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const editPost = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.patch(`http://localhost:65535/api/posts/${post_id}`, {
        title: title === "" ? undefined:title,
        content: content === "" ? undefined:content,
        categories: categories instanceof Array && categories.length === 0 ? undefined:categories
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      setTimeout(() => navigate(`/post/${post_id}`), 3000);
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const selectCategories = (e) => {
    let selectedCategories = Array.from(e.target.options);
    selectedCategories = selectedCategories.filter(category => category.selected).map(category => category.value);
    setCategories(selectedCategories);
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">{props.option === "create" ? "Create a new post":"Edit your post"}</h1>
        <div className="general">
          <form>
            <label>Title of your post</label>
            <input type="text" value={title} placeholder="Write the title..." onChange={e => setTitle(e.target.value)} />
            <label>Content of your post</label>
            <textarea value={content} placeholder="Write a content of your new post..." onChange={e => setContent(e.target.value)}></textarea>
            <label>Choose categories your post belongs to</label>
            <select multiple value={categories} onChange={selectCategories}>
              {categoriesSelector && categoriesSelector.map((category) => <option key={category.id} value={category.title}>{category.title}</option>)}
            </select>
            <button onClick={props.option === "create" ? createPost:editPost}>{props.option === "create" ? "Create":"Edit"}</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default NewPostPage;

