import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
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
  const signUp = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:65535/api/auth/register", {
        fullName: fullName === "" ? undefined:fullName,
        login: login === "" ? undefined:login,
        email: email === "" ? undefined:email,
        pass: pass === "" ? undefined:pass,
        repass: repass === "" ? undefined:repass
      });
      setMessage(res.data.message);
      setTimeout(() => navigate(`/verification/${res.data.token}`), 3000);
    } catch(err) {
      setMessage(err.response.data.message);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Sign up</h1>
        <div className="general">
          <form>
            <label>Your full name</label>
            <input type="text" value={fullName} placeholder="Write your full name..." onChange={e => setFullName(e.target.value)} />
            <label>Your login</label>
            <input type="text" value={login} placeholder="Write your login..." onChange={e => setLogin(e.target.value)} />
            <label>Your e-mail address</label>
            <input type="email" value={email} placeholder="Write your e-mail address..." onChange={e => setEmail(e.target.value)} />
            <label>Your password</label>
            <input type="password" value={pass} placeholder="Write your password..." onChange={e => setPass(e.target.value)} />
            <label>Confirm your password</label>
            <input type="password" value={repass} placeholder="Confirm your password..." onChange={e => setRepass(e.target.value)} />
            <button onClick={signUp}>Sign up</button>
            <Link to="/sign-in">Have already got your account?</Link>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignUpPage;

