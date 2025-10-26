import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import '../style.css';
import { getPosts } from "../postsReducer";
import { getCategories } from "../categoriesReducer";
import Header from "./Header";
import Footer from "./Footer";
import Post from "./Post";
import Radio from "./Radio";
import Checkbox from "./Checkbox";
import Pagination from "./Pagination";

function MainPage() {
  const [message, setMessage] = useState("");
  const [orderBy, setOrderBy] = useState("likes");
  const [order, setOrder] = useState("DESC");
  const [date, setDate] = useState("7Days");
  const [categories, setCategories] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [preferencesChecked, setPreferencesChecked] = useState(false);
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(0);
  const dispatch = useDispatch();
  const postsSelector = useSelector(state => state.posts.posts);
  const pagesSelector = useSelector(state => state.posts.pages);
  const pageSelector = useSelector(state => state.posts.page);
  const postsErrorSelector = useSelector(state => state.posts.error);
  const categoriesSelector = useSelector(state => state.categories.categories);
  const categoriesErrorSelector = useSelector(state => state.categories.error);
  let token;
  if (document.cookie)
    token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
  useEffect(() => {
    dispatch(getCategories({}));
  }, [dispatch]);
  useEffect(() => {
    dispatch(getPosts({
      params: {
        token: token,
        orderBy: orderBy,
        status: status,
        order: order,
        date: date,
        category: categories,
        page: page
      }
    }));
  }, [categories, date, dispatch, order, orderBy, page, status, token]);
  useEffect(() => {
    if (categoriesErrorSelector)
      setMessage(categoriesErrorSelector);
  }, [categoriesErrorSelector]);
  useEffect(() => {
    if (postsErrorSelector)
      setMessage(postsErrorSelector);
  }, [postsErrorSelector]);
  useEffect(() => {
    async function getPreferences() {
      try {
        if (token) {
          const res = await axios.get("http://localhost:65535/api/users/preferences", {
            headers: {authorization: token ? `Bearer ${token}`:token}
          });
          let preferencesNames = [];
          for (let i of res.data.preferences)
            preferencesNames.push(i.title);
          setPreferences(preferencesNames);
        }
      } catch(err) {
        setMessage(err?.response?.data?.message);
      }
    }
    getPreferences();
  }, [token]);
  const checkCategory = function(e) {
    let name = "";
    if (categoriesSelector) {
      for (let i of categoriesSelector) {
        if (i.id === Number(e.target.name))
          name = i.title;
      }
    }
    if (e.target.checked)
      setCategories([...categories, name]);
    else
      setCategories(categories.filter(category => category !== name));
  }
  const checkPreferences = function(e) {
    if (e.target.checked && preferences.length > 0) {
      setCategories([...categories, ...preferences]);
      setPreferencesChecked(true);
    } else {
      setCategories(categories.filter(category => !(preferences.includes(category))));
      setPreferencesChecked(false);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <div className="two-columns">
          <div className="filter">
            <h3>Sorting</h3>
            <div className="preferences">
              <Radio name="orderBy" value="likes" note="By likes" checked={orderBy === "likes" ? true:false} function={e => setOrderBy(e.target.value)} />
              <Radio name="orderBy" value="date" note="By publish date" checked={orderBy === "date" ? true:false} function={e => setOrderBy(e.target.value)} />
              <Radio name="orderBy" value="authorsRating" note="By authors' ratings" checked={orderBy === "authorsRating" ? true:false} function={e => setOrderBy(e.target.value)} />
            </div>
            <h4>Order</h4>
            <div className="preferences">
              <Radio name="order" value="ASC" note="Ascending" checked={order === "ASC" ? true:false} function={e => setOrder(e.target.value)} />
              <Radio name="order" value="DESC" note="Descending" checked={order === "DESC" ? true:false} function={e => setOrder(e.target.value)} />
            </div>
            <h3>Filtering</h3>
            <h4>By publish date</h4>
            <div className="preferences">
              <Radio name="date" value="7Days" note="Last 7 days" checked={date === "7Days" ? true:false} function={e => setDate(e.target.value)} />
              <Radio name="date" value="30Days" note="Last 30 days" checked={date === "30Days" ? true:false} function={e => setDate(e.target.value)} />
            </div>
            <h4>By categories</h4>
            <div className="preferences">
              {token && <Checkbox id="preferences" value="Preferences" checked={preferencesChecked} function={checkPreferences} />}
              {categoriesSelector && categoriesSelector.map((category) => <Checkbox key={category.id} id={category.id} value={category.title} checked={categories.includes(category.title) ? true:false} function={checkCategory} />)}
            </div>
            <h4>By status</h4>
            <div className="preferences">
              <Radio name="status" value="active" note="Active" checked={status === "active" ? true:false} function={e => setStatus(e.target.value)} />
              <Radio name="status" value="all" note="All" checked={status === "all" ? true:false} function={e => setStatus(e.target.value)} />
            </div>
          </div>
          <div className="main-posts">
            {postsSelector && (postsSelector.length === 0 ? <p>No posts</p>:postsSelector.map((post) => <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} photo={post.attachment === null ? undefined:post.attachment} categories={post.categories} preview={true} />))}
            {pagesSelector !== undefined && pageSelector !== undefined && pagesSelector > 1 && <Pagination pages={pagesSelector} page={pageSelector} leftFunction={e => setPage(page - 1)} pageFunction={e => setPage(Number(e.target.name))} rightFunction={e => setPage(page + 1)} />}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

export default MainPage;

