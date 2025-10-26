import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { FaBars } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import '../style.css';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    async function checkUser() {
      try {
        let decodedToken;
        let token;
        if (document.cookie) {
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
          if (token) {
            decodedToken = jwtDecode(token);
            if (decodedToken) {
              const userRes = await axios.get(`http://localhost:65535/api/users/${decodedToken.id}`);
              let role = userRes.data.user.role;
              role = role.at(0).toUpperCase() + role.slice(1);
              setUser({
                id: decodedToken.id,
                login: userRes.data.user.login,
                profile_picture: userRes.data.user.profile_picture,
                role: role
              });
              const notificationsRes = await axios.get("http://localhost:65535/api/notifications", {
                headers: {authorization: token ? `Bearer ${token}`:token}
              });
              let count = 0;
              for (let i of notificationsRes.data.notifications) {
                if (!i.is_read)
                  count += 1;
              }
              setUnreadNotifications(count);
            }
          }
        }
      } catch(err) {
        console.log(err);
        console.log(err?.response?.data?.message || "Something went wrong");
      }
    }
    checkUser();
  }, []);
  const displayMenu = function(e) {
    const menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "none" ? "block":"none";
  }
  const signOut = async function(e) {
    try {
      if (document.cookie) {
        const token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
        const res = await axios.post("http://localhost:65535/api/auth/logout", null, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        document.cookie = encodeURIComponent("User") + "="
                          + encodeURIComponent(res.data.token)
                          + "; path=/; max-age=0";
        setUser(undefined);
        navigate("/");
      }
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <nav className="h-card">
        <ul className="header">
          <li className="menu" onClick={displayMenu}><FaBars color="#fff" size="40" /></li>
          <li>
            <img className="logo avatar-post" src={`${process.env.PUBLIC_URL}/images/logotype.png`} alt="Logo" />
            <span className="title">Stomach Overflow</span>
          </li>
          <li>
            <div className="bar search">
              <input type="search" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
              <button>
                <Link to={`/search/${query}`}>🔍</Link>
              </button>
            </div>
          </li>
          <li>
            <div className="author">
              {user ? <Link to={`/profile/${user.id}/own-posts`}>
                <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${user.profile_picture}`} alt="Avatar" />
              </Link>:<img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/default_avatar.png`} alt="Avatar" />}
              <div className="author-name" id="header-login">
                <p><strong>{user ? user.role:"User"}</strong></p>
                <p>@{user ? user.login:"Not_authorized"}</p>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <div id="menu" style={{display: "none"}}>
        <p className="menu-items">
          <Link to="/">Home</Link>
        </p>
        <p className="menu-items">
          <Link to="/about-us">About us</Link>
        </p>
        {!user ? <>
          <p className="menu-items">
            <Link to="/sign-in">Sign in</Link>
          </p>
          <p className="menu-items">
            <Link to="/sign-up">Sign up</Link>
          </p>
        </>:<>
          <p className="menu-items">
            <Link to="/notifications">Notifications {unreadNotifications > 0 && <span>({unreadNotifications} unread)</span>}</Link>
          </p>
          {user.role === "Admin" && <p className="menu-items">
            <Link to="/admin-panel">Admin panel</Link>
          </p>}
          <p className="menu-items" onClick={signOut}>Sign out</p>
        </>}
      </div>
      {user && <Link to="/create-post">
        <div className="create-post" title="Create a new post">+</div>
      </Link>}
    </>
  );
}

export default Header;

