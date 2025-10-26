import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function VerificationPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const {confirm_token} = useParams();
  useEffect(() => {
    async function checkRights() {
      try {
        let decodedToken;
        let token;
        if (document.cookie) {
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
          if (token)
            decodedToken = jwtDecode(token);
        }
        if (decodedToken) {
          const res = await axios.get(`http://localhost:65535/api/users/${decodedToken.id}`);
          if (res && Boolean(res.data.user.email_confirmed) === true) {
            setMessage("You are already authorized!");
            setTimeout(() => navigate("/"), 3000);
          }
        }
      } catch(err) {
        setMessage(err?.response?.data?.message);
      }
    }
    checkRights();
  }, [navigate]);
  const verify = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:65535/api/auth/verification/${confirm_token}`, {
        code: code === "" ? undefined:code
      });
      document.cookie = encodeURIComponent("User") + "="
	              + encodeURIComponent(res.data.token)
	              + "; path=/; max-age=2592000";
      setMessage(res.data.message);
      setTimeout(() => navigate("/"), 3000);
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Enter the verification code</h1>
        <div className="general">
          <form>
            <input type="text" value={code} id="code" maxLength="6" onChange={e => setCode(e.target.value)} />
            <button onClick={verify}>Verify</button>
            <Link to="/send-mail">Send a code again</Link>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VerificationPage;

