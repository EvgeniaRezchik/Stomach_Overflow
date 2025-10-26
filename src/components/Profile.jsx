import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import '../style.css';
function Profile(props) {
  const [user, setUser] = useState(undefined);
  const [followers, setFollowers] = useState(0);
  const [followed, setFollowed] = useState(0);
  const [isFollowed, setIsFollowed] = useState(false);
  useEffect(() => {
    async function check() {
      try {
        let decodedToken;
        let token;
        if (document.cookie) {
          token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
          if (token) {
            decodedToken = jwtDecode(token);
            if (decodedToken)
              setUser(decodedToken.id);
          }
        }
        if (decodedToken) {
          const followedRes = await axios.get(`http://localhost:65535/api/users/${decodedToken.id}/followed`);
          for (let i of followedRes.data.followedUsers) {
            if (i.id === props.id)
              setIsFollowed(true);
          }
        }
        const followersRes = await axios.get(`http://localhost:65535/api/users/${props.id}/followers`);
        setFollowers(followersRes.data.followers.length);
        const followedRes = await axios.get(`http://localhost:65535/api/users/${props.id}/followed`);
        setFollowed(followedRes.data.followedUsers.length);
      } catch(err) {
        console.log(err?.response?.data?.message || "Something went wrong");
      }
    }
    check();
  }, [props.id]);
  const checkFollowing = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (isFollowed) {
        await axios.delete(`http://localhost:65535/api/users/${props.id}/follow`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFollowed(false);
      } else {
        await axios.post(`http://localhost:65535/api/users/${props.id}/follow`, null, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFollowed(true);
      }
      const followersRes = await axios.get(`http://localhost:65535/api/users/${props.id}/followers`);
      setFollowers(followersRes.data.followers.length);
      const followedRes = await axios.get(`http://localhost:65535/api/users/${props.id}/followed`);
      setFollowed(followedRes.data.followedUsers.length);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <div className="two-columns">
        <div>
          <img className="avatar-profile" src={`${process.env.PUBLIC_URL}/images/${props.avatar}`} alt="User avatar" />
            <p><strong>{props.fullName}</strong></p>
            <p>@{props.login}</p>
            {user ? (user === props.id ? <button>
              <Link to={`/profile/${user}/edit`}>Edit profile</Link>
            </button>:<button onClick={checkFollowing} className={isFollowed ? "unfollow":""}>{isFollowed ? "Unfollow":"Follow"}</button>):<></>}
            <p>{followers > 0 ? <Link to={`/profile/${props.id}/followers`}>{followers} followers</Link>:<span>{followers} followers</span>} | {followed > 0 ? <Link to={`/profile/${props.id}/followed`}>{followed} followed users</Link>:<span>{followed} followed users</span>}</p>
            {user && user === props.id && <Link to={`/profile/${user}/preferences`}>Choose preferences</Link>}
        </div>
        <div className="rating">
          <p>Rating</p>
          <img src={`${process.env.PUBLIC_URL}/images/${props.rating < 0 ? "bad_rating":(props.rating > 0 ? "good_rating":"neutral_rating")}.png`} alt="Rating" />
          <p className={props.rating < 0 ? "bad-rating":(props.rating > 0 ? "good-rating":"")}>{props.rating}</p>
        </div>
      </div>
    </>
  );
}

export default Profile;

