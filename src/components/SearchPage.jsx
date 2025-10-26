import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import Category from "./Category";
import Post from "./Post";

function SearchPage() {
  const {query} = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function search() {
      try {
        let token;
        let usersIds = [];
        let categoriesIds = [];
        let postsIds = [];
        let tempUsers = [];
        let tempCategories = [];
        let tempPosts = [];
        let finalUsers = [];
        let finalCategories = [];
        let finalPosts = [];
        if (document.cookie)
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
        let usersRes = await axios.get(`http://localhost:65535/api/users?login=%${query}%`);
        if (usersRes)
          tempUsers = [...usersRes.data.users];
        usersRes = await axios.get(`http://localhost:65535/api/users?fullName=%${query}%`);
        if (usersRes)
          tempUsers = [...tempUsers, ...usersRes.data.users];
        usersIds = tempUsers.map(user => user.id).filter((currentValue, index, arr) => arr.indexOf(currentValue) === index);
        for (let i of usersIds) {
          for (let j of tempUsers) {
            if (j.id === i) {
              finalUsers.push(j);
              break;
            }
          }
        }
        setUsers(finalUsers);
        let postsRes = await axios.get(`http://localhost:65535/api/posts?title=%${query}%`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        if (postsRes) {
          for (let i of postsRes.data.posts) {
            const authorRes = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
            i.author = authorRes.data.user;
            const categoriesRes = await axios.get(`http://localhost:65535/api/posts/${i.id}/categories`);
            i.categories = categoriesRes.data.categories;
          }
          tempPosts = [...postsRes.data.posts];
        }
        postsRes = await axios.get(`http://localhost:65535/api/posts?content=%${query}%`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        if (postsRes) {
          for (let i of postsRes.data.posts) {
            const authorRes = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
            i.author = authorRes.data.user;
            const categoriesRes = await axios.get(`http://localhost:65535/api/posts/${i.id}/categories`);
            i.categories = categoriesRes.data.categories;
          }
          tempPosts = [...tempPosts, ...postsRes.data.posts];
        }
        postsIds = tempPosts.map(post => post.id).filter((currentValue, index, arr) => arr.indexOf(currentValue) === index);
        for (let i of postsIds) {
          for (let j of tempPosts) {
            if (j.id === i) {
              finalPosts.push(j);
              break;
            }
          }
        }
        setPosts(finalPosts);
        let categoriesRes = await axios.get(`http://localhost:65535/api/categories?title=%${query}%`);
        if (categoriesRes)
          tempCategories = [...categoriesRes.data.categories];
        categoriesRes = await axios.get(`http://localhost:65535/api/categories?description=%${query}%`);
        if (categoriesRes)
          tempCategories = [...tempCategories, ...categoriesRes.data.categories];
        categoriesIds = tempCategories.map(category => category.id).filter((currentValue, index, arr) => arr.indexOf(currentValue) === index);
        for (let i of categoriesIds) {
          for (let j of tempCategories) {
            if (j.id === i) {
              finalCategories.push(j);
              break;
            }
          }
        }
        setCategories(finalCategories);
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    search();
  }, [navigate, query]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1>Results of your search</h1>
        {((!users && !posts && !categories) || (users && posts && categories && users.length === 0 && categories.length === 0 && posts.length === 0)) && <p>There are no users, categories and posts that correspond your query.</p>}
        {users && users.length > 0 && <ul>
          {users.map((user) => <li key={user.id}>
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
            </div>
          </li>)}
        </ul>}
        {categories && categories.length > 0 && <ul>
          {categories.map((category) => <li key={category.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Category title={category.title} description={category.description} />
              </div>
            </div>
          </li>)}
        </ul>}
        {posts && posts.length > 0 && <ul>
          {posts.map((post) => <li key={post.id}>
            <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} categories={post.categories} preview={true} />
          </li>)}
        </ul>}
      </div>
      <Footer />
    </>
  );
}

export default SearchPage;

