import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function NewPasswordPage() {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [message, setMessage] = useState("");
  const {confirm_token} = useParams();
  useEffect(() => {
    let token;
    if (document.cookie)
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    if (token) {
      setMessage("You are already authorized!");
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate]);
  const changePassword = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:65535/api/auth/password-reset/${confirm_token}`, {
        pass: pass === "" ? undefined:pass,
        repass: repass === "" ? undefined:repass
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/sign-in"), 3000);
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Create a new password</h1>
        <div className="general">
          <form>
            <label>Your new password</label>
            <input type="password" value={pass} placeholder="Write your new password..." onChange={e => setPass(e.target.value)} />
            <label>Confirm your new password</label>
            <input type="password" value={repass} placeholder="Confirm your new password..." onChange={e => setRepass(e.target.value)} />
            <button onClick={changePassword}>Create</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default NewPasswordPage;

