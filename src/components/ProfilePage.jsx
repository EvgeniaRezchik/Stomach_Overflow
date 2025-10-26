import { useState, useEffect } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import Profile from "./Profile";
import Post from "./Post";
import Pagination from "./Pagination";
import Radio from "./Radio";
import { getPosts } from "../postsReducer";

function ProfilePage(props) {
  const navLinkStyles = ({ isActive }) => ({
    textDecoration: isActive ? "underline" : "none"
  });
  const navigate = useNavigate();
  const {user_id} = useParams();
  const dispatch = useDispatch();
  const [token, setToken] = useState(undefined);
  const [decodedToken, setDecodedToken] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [ownPosts, setOwnPosts] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState("date");
  const [order, setOrder] = useState("DESC");
  const [message, setMessage] = useState("");
  const postsSelector = useSelector(state => state.posts.posts);
  const pagesSelector = useSelector(state => state.posts.pages);
  const pageSelector = useSelector(state => state.posts.page);
  const postsErrorSelector = useSelector(state => state.posts.error);
  useEffect(() => {
    if (document.cookie) {
      const tempToken = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (tempToken) {
        setToken(tempToken);
        setDecodedToken(jwtDecode(tempToken));
      }
    }
  }, []);
  useEffect(() => {
    async function getOwnPosts() {
      try {
        const userRes = await axios.get(`http://localhost:65535/api/users/${user_id}`);
        dispatch(getPosts({
          params: {
            token: token,
            user: userRes.data.user.login,
            orderBy: orderBy,
            order: order,
            page: page
          }
        }));
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getOwnPosts();
  }, [dispatch, navigate, order, orderBy, page, token, user_id]);
  useEffect(() => {
    if (postsSelector)
      setOwnPosts(postsSelector);
  }, [postsSelector]);
  useEffect(() => {
    async function getUser() {
      try {
        const userRes = await axios.get(`http://localhost:65535/api/users/${user_id}`);
        const followersRes = await axios.get(`http://localhost:65535/api/users/${user_id}/followers`);
        userRes.data.user.followers = followersRes.data.followers.length;
        const followedRes = await axios.get(`http://localhost:65535/api/users/${user_id}/followed`);
        userRes.data.user.followedUsers = followedRes.data.followedUsers.length;
        setUser(userRes.data.user);
        const followingsRes = await axios.get(`http://localhost:65535/api/users/${user_id}/followings`);
        if (followingsRes.data.followings.length > 0) {
          followingsRes.data.followings = followingsRes.data.followings.filter(post => post.status === "active");
          for (let i = 0; i < followingsRes.data.followings.length; i += 1) {
            const authorRes = await axios.get("http://localhost:65535/api/users/" + followingsRes.data.followings[i].author_id);
            followingsRes.data.followings[i].author = authorRes.data.user;
            const categoriesRes = await axios.get("http://localhost:65535/api/posts/" + followingsRes.data.followings[i].id + "/categories");
            followingsRes.data.followings[i].categories = categoriesRes.data.categories;
          }
        }
        setFollowings(followingsRes.data.followings);
        if (decodedToken) {
          const favoritesRes = await axios.get("http://localhost:65535/api/users/favorites", {
            headers: {authorization: token ? `Bearer ${token}`:token}
          });
          if (favoritesRes.data.favorites.length > 0) {
            favoritesRes.data.favorites = favoritesRes.data.favorites.filter(post => post.status === "active");
            for (let i = 0; i < favoritesRes.data.favorites.length; i += 1) {
              const authorRes = await axios.get("http://localhost:65535/api/users/" + favoritesRes.data.favorites[i].author_id);
              favoritesRes.data.favorites[i].author = authorRes.data.user;
              const categoriesRes = await axios.get("http://localhost:65535/api/posts/" + favoritesRes.data.favorites[i].id + "/categories");
              favoritesRes.data.favorites[i].categories = categoriesRes.data.categories;
            }
          }
          setFavorites(favoritesRes.data.favorites);
        }
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getUser();
  }, [decodedToken, navigate, token, user_id]);
  useEffect(() => {
    if (postsErrorSelector) {
      setMessage(postsErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate, postsErrorSelector]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        {user && <div className="profile-content two-columns">
          <Profile id={user.id} avatar={user.profile_picture} fullName={user.full_name} login={user.login} followers={user.followers} followed={user.followedUsers} rating={user.rating} />
          <div className="profile-posts-section">
            <nav className="h-card">
              <ul>
                <li>
                  <NavLink to={`/profile/${user.id}/own-posts`} style={navLinkStyles}>Own posts</NavLink>
                </li>
                <li>
                  <NavLink to={`/profile/${user.id}/followings`} style={navLinkStyles}>Followed posts</NavLink>
                </li>
                {decodedToken && decodedToken.id === user.id && <li>
                  <NavLink to={`/profile/${user.id}/favorites`} style={navLinkStyles}>Favorites</NavLink>
                </li>}
              </ul>
            </nav>
            <div className="profile-posts">
              {props.posts === "own" ? (!ownPosts || (ownPosts && ownPosts.length === 0) ? <p className="absence">No own posts</p>:ownPosts.map((post) => <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={user.id} avatar={user.profile_picture} fullName={user.full_name} login={user.login} title={post.title} content={post.content} categories={post.categories} preview={true} />)):(props.posts === "followings" ? (!followings || (followings && followings.length === 0) ? <p className="absence">No followed posts</p>:followings.map((post) => <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} categories={post.categories} preview={true} />)):(props.posts === "favorites" ? (!favorites || (favorites && favorites.length === 0) ? <p className="absence">No favorite posts</p>:favorites.map((post) => <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} categories={post.categories} preview={true} />)):<p>Something went wrong</p>))}
            </div>
            {pagesSelector !== undefined && pageSelector !== undefined && pagesSelector > 1 && <Pagination pages={pagesSelector} page={pageSelector} leftFunction={e => setPage(page - 1)} pageFunction={e => setPage(Number(e.target.name))} rightFunction={e => setPage(page + 1)} />}
            {props.posts === "own" && decodedToken && decodedToken.id === user.id && ownPosts && ownPosts.length > 1 && <div className="filter">
              <h3>Sorting</h3>
              <div className="preferences">
                <Radio name="orderBy" value="likes" note="By likes" checked={orderBy === "likes" ? true:false} function={e => setOrderBy(e.target.value)} />
                <Radio name="orderBy" value="date" note="By publish date" checked={orderBy === "date" ? true:false} function={e => setOrderBy(e.target.value)} />
              </div>
              <h4>Order</h4>
              <div className="preferences">
                <Radio name="order" value="ASC" note="Ascending" checked={order === "ASC" ? true:false} function={e => setOrder(e.target.value)} />
                <Radio name="order" value="DESC" note="Descending" checked={order === "DESC" ? true:false} function={e => setOrder(e.target.value)} />
              </div>
            </div>}
          </div>
        </div>}
      </div>
      <Footer />
    </>
  );
}

export default ProfilePage;

