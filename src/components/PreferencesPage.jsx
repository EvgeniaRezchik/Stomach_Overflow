import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import Checkbox from "./Checkbox";
import { getCategories } from "../categoriesReducer";

function PreferencesPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState([]);
  const [message, setMessage] = useState("");
  const {user_id} = useParams();
  const dispatch = useDispatch();
  const categoriesSelector = useSelector(state => state.categories.categories);
  const categoriesErrorSelector = useSelector(state => state.categories.error);
  let token;
  if (document.cookie)
    token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
  useEffect(() => {
    async function checkPreferences() {
      try {
        if (!token) {
          setMessage("You are not authorized!");
          setTimeout(() => navigate("/"), 3000);
        }
        dispatch(getCategories({}));
        const preferencesRes = await axios.get("http://localhost:65535/api/users/preferences", {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        let preferencesArray = [];
        for (let i of preferencesRes.data.preferences)
          preferencesArray.push(i.id);
        setPreferences(preferencesArray);
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
      }
    }
    checkPreferences();
  }, [dispatch, navigate, token]);
  useEffect(() => {
    if (categoriesErrorSelector) {
      setMessage(categoriesErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [categoriesErrorSelector, navigate]);
  const checkPreference = function(e) {
    if (e.target.checked)
      setPreferences([...preferences, Number(e.target.name)]);
    else
      setPreferences(preferences.filter(category => category !== Number(e.target.name)));
  }
  const addPreferences = async function(e) {
    e.preventDefault();
    try {
      const preferencesRes = await axios.get("http://localhost:65535/api/users/preferences", {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      for (let i of preferencesRes.data.preferences)
        await axios.delete(`http://localhost:65535/api/categories/${i.id}/preference`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
      const checkboxes = document.querySelectorAll("input");
      let pageMessage = "";
      for (let i of checkboxes) {
        if (i.checked) {
          const res = await axios.post(`http://localhost:65535/api/categories/${i.name}/preference`, null, {
            headers: {authorization: token ? `Bearer ${token}`:token}
          });
          pageMessage = res.data.message;
        }
      }
      setMessage(pageMessage);
      setTimeout(() => navigate(`/profile/${user_id}/own-posts`), 3000);
    } catch(err) {
      setMessage(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Add categories to preferences</h1>
        <div className="general">
          <div className="preferences">
            {categoriesSelector && categoriesSelector.map((category) => <Checkbox key={category.id} id={category.id} value={category.title} checked={preferences.includes(category.id) ? true:false} function={checkPreference} />)}
          </div>
          <Link to={`/profile/${user_id}/own-posts`}>Do it later</Link>
          <button onClick={addPreferences}>Add</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PreferencesPage;

