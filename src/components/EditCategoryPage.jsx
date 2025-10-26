import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function EditCategoryPage() {
  const navigate = useNavigate();
  const {category_id} = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteDescription, setDeleteDescription] = useState(false);
  const [message, setMessage] = useState("");
  let token;
  if (document.cookie)
    token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
  useEffect(() => {
    async function checkCategory() {
      try {
        if (!token) {
          setMessage("You are not authorized!");
          setTimeout(() => navigate("/"), 3000);
        }
        const categoryRes = await axios.get(`http://localhost:65535/api/categories/${category_id}`);
        setTitle(categoryRes.data.category.title);
        setDescription(categoryRes.data.category.description);
      } catch(err) {
        setMessage(err?.response?.data?.message);
        setTimeout(() => navigate("/admin-panel"), 3000);
      }
    }
    checkCategory();
  }, [category_id, navigate, token]);
  const editCategory = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.patch(`http://localhost:65535/api/categories/${category_id}`, {
        title: title === "" ? undefined:title,
        description: description === "" ? undefined:description,
        deleteDescription: deleteDescription
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/admin-panel"), 3000);
    } catch(err) {
      setMessage(err?.response?.data?.message);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Edit category</h1>
        <div className="general">
          <form>
            <label>New title</label>
            <input type="text" value={title} placeholder="Write the title..." onChange={e => setTitle(e.target.value)} />
            <label>New description</label>
            <input type="text" value={description} placeholder="Write the description..." onChange={e => setDescription(e.target.value)} />
            <div className="bar toggler-block">
              <label>Delete the description: </label>
              <label className="toggler" htmlFor="checkbox">
                <input type="checkbox" id="checkbox" name="notifications" checked={deleteDescription} onChange={e => setDeleteDescription(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
            <button onClick={editCategory}>Edit</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default EditCategoryPage;

