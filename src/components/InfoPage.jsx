import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function InfoPage(props) {
  const navigate = useNavigate();
  const {user_id, post_id, comment_id} = useParams();
  const [followers, setFollowers] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [likers, setLikers] = useState([]);
  const [dislikers, setDislikers] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function getInfo() {
      try {
        if (user_id) {
          if (props.info === "userFollowers") {
            const res = await axios.get(`http://localhost:65535/api/users/${user_id}/followers`);
            setFollowers(res.data.followers);
          } else if (props.info === "userFollowed") {
            const res = await axios.get(`http://localhost:65535/api/users/${user_id}/followed`);
            setFollowed(res.data.followedUsers);
          }
        } else if (post_id) {
          if (props.info === "postFollowers") {
            const res = await axios.get(`http://localhost:65535/api/posts/${post_id}/followers`);
            setFollowers(res.data.followers);
          } else if (props.info === "postReactions") {
            const reactionsRes = await axios.get(`http://localhost:65535/api/posts/${post_id}/like`);
            let dislikersArr = [];
            let likersArr = [];
            for (let i of reactionsRes.data.likes) {
              if (i.type === "like") {
                const res = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
                likersArr.push(res.data.user);
              } else {
                const res = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
                dislikersArr.push(res.data.user);
              }
            }
            setLikers(likersArr);
            setDislikers(dislikersArr);
          }
        } else if (comment_id) {
          if (props.info === "commentReactions") {
            const reactionsRes = await axios.get(`http://localhost:65535/api/comments/${comment_id}/like`);
            let dislikersArr = [];
            let likersArr = [];
            for (let i of reactionsRes.data.likes) {
              if (i.type === "like") {
                const res = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
                likersArr.push(res.data.user);
              } else {
                const res = await axios.get(`http://localhost:65535/api/users/${i.author_id}`);
                dislikersArr.push(res.data.user);
              }
            }
            setLikers(likersArr);
            setDislikers(dislikersArr);
          }
        }
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getInfo();
  }, [comment_id, navigate, post_id, props.info, user_id]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1>{props.info === "userFollowers" || props.info === "postFollowers" ? "Followers":(props.info === "userFollowed" ? "Followed users":(props.info === "postReactions" || props.info === "commentReactions" ? "Likes":""))}</h1>
        {props.info === "userFollowers" || props.info === "postFollowers" ? (followers.length === 0 ? <p>No followers</p>:<ul>
          {followers.map((follower) => <li key={follower.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Link to={`/profile/${follower.id}/own-posts`}>
                  <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${follower.profile_picture}`} alt="Avatar" />
                </Link>
                <div className="author-name">
                  <Link to={`/profile/${follower.id}/own-posts`}>
                    <p><strong>{follower.full_name}</strong></p>
                  </Link>
                  <Link to={`/profile/${follower.id}/own-posts`}>
                    <p>@{follower.login}</p>
                  </Link>
                </div>
              </div>
            </div>
          </li>)}
        </ul>):(props.info === "userFollowed" ? (followed.length === 0 ? <p>No followed users</p>:<ul>
          {followed.map((followedUser) => <li key={followedUser.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Link to={`/profile/${followedUser.id}/own-posts`}>
                  <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${followedUser.profile_picture}`} alt="Avatar" />
                </Link>
                <div className="author-name">
                  <Link to={`/profile/${followedUser.id}/own-posts`}>
                    <p><strong>{followedUser.full_name}</strong></p>
                  </Link>
                  <Link to={`/profile/${followedUser.id}/own-posts`}>
                    <p>@{followedUser.login}</p>
                  </Link>
                </div>
              </div>
            </div>
          </li>)}
        </ul>):(props.info === "postReactions" || props.info === "commentReactions" ? (likers.length === 0 ? <p>No likes</p>:<ul>
          {likers.map((liker) => <li key={liker.id}>
            <div className="bar admin-panel-bar">
              <div className="item-name">
                <Link to={`/profile/${liker.id}/own-posts`}>
                  <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${liker.profile_picture}`} alt="Avatar" />
                </Link>
                <div className="author-name">
                  <Link to={`/profile/${liker.id}/own-posts`}>
                    <p><strong>{liker.full_name}</strong></p>
                  </Link>
                  <Link to={`/profile/${liker.id}/own-posts`}>
                    <p>@{liker.login}</p>
                  </Link>
                </div>
              </div>
            </div>
          </li>)}
        </ul>):<></>))}
        {props.info === "postReactions" || props.info === "commentReactions" ? <>
          <h1>Dislikes</h1>
          {dislikers.length === 0 ? <p>No dislikes</p>:<ul>
            {dislikers.map((disliker) => <li key={disliker.id}>
              <div className="bar admin-panel-bar">
                <div className="item-name">
                  <Link to={`/profile/${disliker.id}/own-posts`}>
                    <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${disliker.profile_picture}`} alt="Avatar" />
                  </Link>
                  <div className="author-name">
                    <Link to={`/profile/${disliker.id}/own-posts`}>
                      <p><strong>{disliker.full_name}</strong></p>
                    </Link>
                    <Link to={`/profile/${disliker.id}/own-posts`}>
                      <p>@{disliker.login}</p>
                    </Link>
                  </div>
                </div>
              </div>
            </li>)}
          </ul>}
        </>:<></>}
      </div>
      <Footer />
    </>
  );
}

export default InfoPage;

