import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function SendMailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [option, setOption] = useState("");
  const [message, setMessage] = useState("");
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
  const sendMail = async function(e) {
    e.preventDefault();
    if (option === "reset") {
      try {
        const res = await axios.post("http://localhost:65535/api/auth/password-reset", {
          email: email === "" ? undefined:email
        });
        setMessage(res.data.message);
      } catch(err) {
        setMessage(err.response.data.message);
      }
    } else if (option === "verify") {
      try {
        const res = await axios.post("http://localhost:65535/api/auth/verification", {
          email: email === "" ? undefined:email
        });
        setMessage(res.data.message);
        setTimeout(() => navigate(`/verification/${res.data.token}`), 3000);
      } catch(err) {
        setMessage(err.response.data.message);
      }
    } else
      setMessage("Choose what you want to do!");
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Reset the password or verify the e-mail address</h1>
        <div className="general">
          <form>
            <label>Your e-mail address</label>
            <input type="email" value={email} placeholder="Write your e-mail address..." onChange={e => setEmail(e.target.value)} />
            <div className="options-block">
              <input type="radio" value="reset" onChange={e => setOption(e.target.value)} />Reset the password
              <input type="radio" value="verify" onChange={e => setOption(e.target.value)} />Verify the e-mail address
            </div>
            <button onClick={sendMail}>Submit</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SendMailPage;

