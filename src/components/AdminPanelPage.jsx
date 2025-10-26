import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaChevronUp, FaChevronDown, FaPen, FaTrash } from "react-icons/fa";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import Category from "./Category";
import Post from "./Post";
import Pagination from "./Pagination";
import { getUsers } from "../usersReducer";
import { getCategories } from "../categoriesReducer";
import { getPosts } from "../postsReducer";

function AdminPanelPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const usersSelector = useSelector(state => state.users.users);
  const usersPagesSelector = useSelector(state => state.users.pages);
  const usersPageSelector = useSelector(state => state.users.page);
  const usersErrorSelector = useSelector(state => state.users.error);
  const categoriesSelector = useSelector(state => state.categories.categories);
  const categoriesPagesSelector = useSelector(state => state.categories.pages);
  const categoriesPageSelector = useSelector(state => state.categories.page);
  const categoriesErrorSelector = useSelector(state => state.categories.error);
  const postsSelector = useSelector(state => state.posts.posts);
  const postsPagesSelector = useSelector(state => state.posts.pages);
  const postsPageSelector = useSelector(state => state.posts.page);
  const postsErrorSelector = useSelector(state => state.posts.error);
  const [users, setUsers] = useState([]);
  const [usersVisible, setUsersVisible] = useState(false);
  const [categoriesVisible, setCategoriesVisible] = useState(false);
  const [postsVisible, setPostsVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [role, setRole] = useState("user");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [usersPage, setUsersPage] = useState(0);
  const [categoriesPage, setCategoriesPage] = useState(0);
  const [postsPage, setPostsPage] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function getInfo() {
      try {
        let token;
        if (document.cookie)
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
        else {
          setMessage("You are not authorized!");
          setTimeout(() => navigate("/"), 3000);
        }
        dispatch(getUsers({
          params: {
            page: usersPage
          }
        }));
        dispatch(getPosts({
          params: {
            token: token,
            page: postsPage
          }
        }));
        dispatch(getCategories({
          params: {
            page: categoriesPage
          }
        }));
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getInfo();
  }, [categoriesPage, dispatch, navigate, postsPage, usersPage]);
  useEffect(() => {
    let decodedToken;
    let token;
    if (document.cookie) {
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (token)
        decodedToken = jwtDecode(token);
    }
    if (usersSelector && decodedToken)
      setUsers(usersSelector.filter(user => user.id !== decodedToken.id));
  }, [usersSelector]);
  useEffect(() => {
    if (usersErrorSelector) {
      setMessage(usersErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate, usersErrorSelector]);
  useEffect(() => {
    if (categoriesErrorSelector) {
      setMessage(categoriesErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [categoriesErrorSelector, navigate]);
  useEffect(() => {
    if (postsErrorSelector) {
      setMessage(postsErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate, postsErrorSelector]);
  const showUsers = function(e) {
    const users = document.getElementById("users");
    users.style.display = users.style.display === "none" ? "block":"none";
    setUsersVisible(users.style.display === "none" ? false:true);
  }
  const showUserForm = function(e) {
    document.getElementById("userForm").style.display = "block";
  }
  const hideUserForm = function(e) {
    document.getElementById("userForm").style.display = "none";
  }
  const createUser = async function(e) {
    e.preventDefault();
    let decodedToken;
    let token;
    if (document.cookie) {
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (token)
        decodedToken = jwtDecode(token);
    }
    try {
      const res = await axios.post("http://localhost:65535/api/users", {
        fullName: fullName === "" ? undefined:fullName,
        login: login === "" ? undefined:login,
        email: email === "" ? undefined:email,
        pass: pass === "" ? undefined:pass,
        repass: repass === "" ? undefined:repass,
        role: role
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      dispatch(getUsers({}));
      setUsers(usersSelector.filter(user => user.id !== decodedToken.id));
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const deleteUser = async function(e) {
    e.preventDefault();
    let decodedToken;
    let token;
    if (document.cookie) {
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (token)
        decodedToken = jwtDecode(token);
    }
    try {
      const id = Number(e.target.parentNode.id.substring("user".length, e.target.parentNode.id.length));
      const res = await axios.delete(`http://localhost:65535/api/users/${id}`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      dispatch(getUsers({}));
      setUsers(usersSelector.filter(user => user.id !== decodedToken.id));
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const showCategories = function(e) {
    const categories = document.getElementById("categories");
    categories.style.display = categories.style.display === "none" ? "block":"none";
    setCategoriesVisible(categories.style.display === "none" ? false:true);
  }
  const showCategoryForm = function(e) {
    document.getElementById("categoryForm").style.display = "block";
  }
  const hideCategoryForm = function(e) {
    document.getElementById("categoryForm").style.display = "none";
  }
  const createCategory = async function(e) {
    e.preventDefault();
    let token;
    if (document.cookie) {
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    }
    try {
      const res = await axios.post("http://localhost:65535/api/categories", {
        title: title === "" ? undefined:title,
        description: description === "" ? undefined:description
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      dispatch(getCategories({}));
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const deleteCategory = async function(e) {
    e.preventDefault();
    let token;
    if (document.cookie) {
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    }
    try {
      const id = Number(e.target.parentNode.id.substring("category".length, e.target.parentNode.id.length));
      const res = await axios.delete(`http://localhost:65535/api/categories/${id}`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      dispatch(getCategories({}));
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  const showPosts = function(e) {
    const posts = document.getElementById("posts");
    posts.style.display = posts.style.display === "none" ? "block":"none";
    setPostsVisible(posts.style.display === "none" ? false:true);
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1>Admin panel</h1>
        <div className="bar admin-panel-header" onClick={showUsers}>
          <div className="arrow">
            {usersVisible ? <FaChevronUp color="#5e2708" />:<FaChevronDown color="#5e2708" />}
          </div>
          <p>Users</p>
        </div>
        <ul id="users" style={{display: "none"}}>
          {users && users.map((user) => <li key={user.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Link to={`/profile/${user.id}/own-posts`}>
                  <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${user.profile_picture}`} alt="Avatar" />
                </Link>
                <div className="author-name">
                  <Link to={`/profile/${user.id}/own-posts`}>
                    <p><strong>{user.full_name}</strong></p>
                  </Link>
                  <Link to={`/profile/${user.id}/own-posts`}>
                    <p>@{user.login}</p>
                  </Link>
                </div>
              </div>
              <div className="actions">
                <div className="action">
                  <button>
                    <Link to={`/profile/${user.id}/edit`}>
                      <FaPen color="#b3501b" />
                    </Link>
                  </button>
                </div>
                <div className="action">
                  <button onClick={deleteUser}>
                    <FaTrash id={`user${user.id}`} color="#b3501b" />
                  </button>
                </div>
              </div>
            </div>
          </li>)}
          {usersPagesSelector !== undefined && usersPageSelector !== undefined && usersPagesSelector > 1 && <li>
            <Pagination pages={usersPagesSelector} page={usersPageSelector} leftFunction={e => setUsersPage(usersPage - 1)} pageFunction={e => setUsersPage(Number(e.target.name))} rightFunction={e => setUsersPage(usersPage + 1)} />
          </li>}
          <li>
            <button title="Create a user" onClick={showUserForm}>+</button>
            <div className="bar admin-panel-form" id="userForm" style={{display: "none"}}>
              <div className="cancel" onClick={hideUserForm}>x</div>
              <form>
                <label>Full name</label>
                <input type="text" value={fullName} placeholder="Write a full name..." onChange={e => setFullName(e.target.value)} />
                <label>Login</label>
                <input type="text" value={login} placeholder="Write a login..." onChange={e => setLogin(e.target.value)} />
                <label>E-mail address</label>
                <input type="email" value={email} placeholder="Write a e-mail address..." onChange={e => setEmail(e.target.value)} />
                <label>Password</label>
                <input type="password" value={pass} placeholder="Write a password..." onChange={e => setPass(e.target.value)} />
                <label>Password confirmation</label>
                <input type="password" value={repass} placeholder="Confirm the password..." onChange={e => setRepass(e.target.value)} />
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button onClick={createUser}>+</button>
              </form>
            </div>
          </li>
        </ul>
        <div className="bar admin-panel-header" onClick={showCategories}>
          <div className="arrow">
            {categoriesVisible ? <FaChevronUp color="#5e2708" />:<FaChevronDown color="#5e2708" />}
          </div>
          <p>Categories</p>
        </div>
        <ul id="categories" style={{display: "none"}}>
          {categoriesSelector && categoriesSelector.map((category) => <li key={category.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Category title={category.title} description={category.description} />
              </div>
              <div className="actions">
                <div className="action">
                  <button>
                    <Link to={`/category/${category.id}/edit`}>
                      <FaPen color="#b3501b" />
                    </Link>
                  </button>
                </div>
                <div className="action">
                  <button onClick={deleteCategory}>
                    <FaTrash id={`category${category.id}`} color="#b3501b" />
                  </button>
                </div>
              </div>
            </div>
          </li>)}
          {categoriesPagesSelector !== undefined && categoriesPageSelector !== undefined && categoriesPagesSelector > 1 && <li>
            <Pagination pages={categoriesPagesSelector} page={categoriesPageSelector} leftFunction={e => setCategoriesPage(categoriesPage - 1)} pageFunction={e => setCategoriesPage(Number(e.target.name))} rightFunction={e => setCategoriesPage(categoriesPage + 1)} />
          </li>}
          <li>
            <button title="Create a category" onClick={showCategoryForm}>+</button>
            <div className="bar admin-panel-form" id="categoryForm" style={{display: "none"}}>
              <div className="cancel" onClick={hideCategoryForm}>x</div>
              <form>
                <label>Title</label>
                <input type="text" value={title} placeholder="Write a title..." onChange={e => setTitle(e.target.value)} />
                <label>Description</label>
                <textarea value={description} placeholder="Write a description..." onChange={e => setDescription(e.target.value)}></textarea>
                <button onClick={createCategory}>+</button>
              </form>
            </div>
          </li>
        </ul>
        <div className="bar admin-panel-header" onClick={showPosts}>
          <div className="arrow">
            {postsVisible ? <FaChevronUp color="#5e2708" />:<FaChevronDown color="#5e2708" />}
          </div>
          <p>Posts</p>
        </div>
        <div id="posts" style={{display: "none"}}>
          {!postsSelector || (postsSelector && postsSelector.length === 0) ? <p>No posts</p>:<ul>
            {postsSelector && postsSelector.map((post) => <li key={post.id}>
              <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} categories={post.categories} preview={true} />
            </li>)}
            {postsPagesSelector !== undefined && postsPageSelector !== undefined && postsPagesSelector > 1 && <li>
              <Pagination pages={postsPagesSelector} page={postsPageSelector} leftFunction={e => setPostsPage(postsPage - 1)} pageFunction={e => setPostsPage(Number(e.target.name))} rightFunction={e => setPostsPage(postsPage + 1)} />
            </li>}
          </ul>}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AdminPanelPage;

