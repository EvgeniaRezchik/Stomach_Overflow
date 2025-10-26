import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function EditProfilePage() {
  const navigate = useNavigate();
  const {user_id} = useParams();
  const [avatar, setAvatar] = useState(undefined);
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [repass, setRepass] = useState("");
  const [role, setRole] = useState(undefined);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [message, setMessage] = useState("");
  let decodedToken;
  let token;
  if (document.cookie) {
    token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    if (token)
      decodedToken = jwtDecode(token);
  }
  useEffect(() => {
    async function checkUser() {
      try {
        let decodedToken;
        let token;
        if (document.cookie) {
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
          if (token)
            decodedToken = jwtDecode(token);
        } else {
          setMessage("You are not authorized!");
          setTimeout(() => navigate("/"), 3000);
        }
        const userRes = await axios.get(`http://localhost:65535/api/users/${user_id}`);
        setAvatar(userRes.data.user.profile_picture);
        setFullName(userRes.data.user.full_name);
        setLogin(userRes.data.user.login);
        setEmail(userRes.data.user.email_address);
        if (decodedToken && decodedToken.role === "admin")
          setRole(userRes.data.user.role);
        setNotificationsOn(userRes.data.user.notifications_on);
      } catch(err) {
        setMessage(err?.response?.data?.message);
        setTimeout(() => navigate(`/profile/${user_id}/own-posts`), 3000);
      }
    }
    checkUser();
  }, [navigate, user_id]);
  const uploadAvatar = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      const photo = e.target.files[0];
      if (photo) {
        const fd = new FormData();
        fd.append("avatar", photo);
        e.target.value = "";
        const res = await axios.patch("http://localhost:65535/api/users/avatar", fd, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setAvatar(res.data.src);
      }
    } catch(err) {
      setMessage(err?.response?.data?.message);
    }
  }
  const deleteAvatar = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      const res = await axios.delete("http://localhost:65535/api/users/avatar", {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setAvatar(res.data.src);
    } catch(err) {
      setMessage(err?.response?.data?.message);
    }
  }
  const editProfile = async function(e) {
    e.preventDefault();
    try {
      const res = await axios.patch(`http://localhost:65535/api/users/${user_id}`, {
        fullName: fullName === "" ? undefined:fullName,
        login: login === "" ? undefined:login,
        email: email === "" ? undefined:email,
        pass: pass === "" ? undefined:pass,
        repass: repass === "" ? undefined:repass,
        role: role,
        notificationsOn: notificationsOn
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setMessage(res.data.message);
      setTimeout(() => navigate(email !== "" && email !== decodedToken.email_address && (decodedToken.role !== "admin" || (decodedToken.role === "admin" && decodedToken.id === user_id)) ? `/verification/${res.data.token}`:`/profile/${user_id}/own-posts`), 3000);
    } catch(err) {
      setMessage(err?.response?.data?.message);
    }
  }
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1 className="form-header">Edit profile</h1>
        <div className="general">
          <form>
            <img className="avatar-profile" src={`${process.env.PUBLIC_URL}/images/${avatar}`} alt="Avatar" />
            <button type="button">
              <label htmlFor="avatar">Change your avatar</label>
            </button>
            <input type="file" id="avatar" accept="image/*" onChange={uploadAvatar} />
            <button type="button" onClick={deleteAvatar}>Delete the avatar</button>
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
            {decodedToken && decodedToken.role === "admin" && <>
              <label>Choose the user's role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </>}
            <div className="bar toggler-block">
              <label>Notifications: </label>
              <label className="toggler" htmlFor="checkbox">
                <input type="checkbox" id="checkbox" name="notifications" checked={notificationsOn} onChange={e => setNotificationsOn(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
            <button onClick={editProfile}>Edit profile</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default EditProfilePage;

