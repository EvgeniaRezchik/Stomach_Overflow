import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function SignInPage() {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("");
  const [pass, setPass] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let token;
    if (document.cookie)
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    if (token) {
      setMessage("You are already authorized!");
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate]);
  const signIn = async function(e) {
    e.preventDefault();
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      const res = await axios.post("http://localhost:65535/api/auth/login", {
        loginEmail: loginEmail === "" ? undefined:loginEmail,
        pass: pass === "" ? undefined:pass
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
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
        <h1 className="form-header">Sign in</h1>
        <div className="general">
          <form>
            <label>Your login or e-mail address</label>
            <input type="text" value={loginEmail} placeholder="Write your login / e-mail..." onChange={e => setLoginEmail(e.target.value)} />
            <label>Your password</label>
            <input type="password" value={pass} placeholder="Write your password..." onChange={e => setPass(e.target.value)} />
            <Link to="/send-mail">Forgot your password / Want to verify your e-mail address?</Link>
            <button onClick={signIn}>Sign in</button>
            <Link to="/sign-up">Haven't got an account yet?</Link>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignInPage;

