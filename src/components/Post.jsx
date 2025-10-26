import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { FaComment, FaThumbsUp, FaThumbsDown, FaPaperclip, FaBookmark, FaPlus, FaEye, FaImage, FaPen, FaLock, FaTrash } from "react-icons/fa";
import '../style.css';
import { getComments } from "../commentsReducer";
import getFormattedDate from "../getFormattedDate";
import Category from "./Category";

function Post(props) {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [comments, setComments] = useState(0);
  const [comment, setComment] = useState("");
  const [reaction, setReaction] = useState("");
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [locked, setLocked] = useState(false);
  const dispatch = useDispatch();
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
              setUser({
                id: decodedToken.id,
                role: decodedToken.role
              });
          }
        }
        const postRes = await axios.get(`http://localhost:65535/api/posts/${props.id}`);
        setPhoto(postRes.data.post.attachment);
        setLocked(postRes.data.post.status === "inactive" ? true:false);
        const commentsRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/comments`);
        setComments(commentsRes.data.comments.length);
        const reactionsRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/like`);
        let dislikesCount = 0;
        let likesCount = 0;
        for (let i of reactionsRes.data.likes) {
          if (i.type === "like") {
            likesCount += 1;
            if (decodedToken && i.author_id === decodedToken.id)
              setReaction("like");
          } else {
            dislikesCount += 1;
            if (decodedToken && i.author_id === decodedToken.id)
              setReaction("dislike");
          }
        }
        setLikes(likesCount);
        setDislikes(dislikesCount);
        if (decodedToken) {
          const favoritesRes = await axios.get("http://localhost:65535/api/users/favorites", {
            headers: {authorization: token ? `Bearer ${token}`:token}
          });
          if (favoritesRes.data.favorites.length === 0)
            setIsFavorite(false);
          else {
            for (let i of favoritesRes.data.favorites) {
              if (i.id === props.id)
                setIsFavorite(true);
            }
          }
        }
        const followersRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/followers`);
        setFollowers(followersRes.data.followers.length);
        for (let i of followersRes.data.followers) {
          if (decodedToken && i.id === decodedToken.id)
            setIsFollowed(true);
        }
      } catch(err) {
        console.log(err?.response?.data?.message || "Something went wrong");
      }
    }
    check();
  }, [props.id]);
  const displayCommentForm = function(e) {
    let commentForm = document.getElementById(`commentForm${props.id}`);
    commentForm.style.display = commentForm.style.display === "none" ? "block":"none";
  }
  const writeComment = async function(e) {
    e.preventDefault();
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.post(`http://localhost:65535/api/posts/${props.id}/comments`, {
        content: comment === "" ? undefined:comment
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      document.getElementById(`commentForm${props.id}`).style.display = "none";
      const commentsRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/comments`);
      setComments(commentsRes.data.comments.length);
      dispatch(getComments({
        params: {
          postId: props.id
        }
      }));
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const checkLike = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (reaction === "like") {
        await axios.delete(`http://localhost:65535/api/posts/${props.id}/like`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("");
      } else {
        await axios.post(`http://localhost:65535/api/posts/${props.id}/like`, {
          type: "like"
        }, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("like");
      }
      const reactsRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/like`);
      let dislikesCount = 0;
      let likesCount = 0;
      for (let i of reactsRes.data.likes) {
        if (i.type === "like")
          likesCount += 1;
        else
          dislikesCount += 1;
      }
      setLikes(likesCount);
      setDislikes(dislikesCount);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const checkDislike = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (reaction === "dislike") {
        await axios.delete(`http://localhost:65535/api/posts/${props.id}/like`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("");
      } else {
        await axios.post(`http://localhost:65535/api/posts/${props.id}/like`, {
          type: "dislike"
        }, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("dislike");
      }
      const reactsRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/like`);
      let dislikesCount = 0;
      let likesCount = 0;
      for (let i of reactsRes.data.likes) {
        if (i.type === "like")
          likesCount += 1;
        else
          dislikesCount += 1;
      }
      setLikes(likesCount);
      setDislikes(dislikesCount);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const attachPhoto = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      const postPhoto = e.target.files[0];
      if (postPhoto) {
        const fd = new FormData();
        fd.append("photo", postPhoto);
        e.target.value = "";
        const res = await axios.patch(`http://localhost:65535/api/posts/${props.id}/photo`, fd, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setPhoto(res.data.src);
      }
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const unattachPhoto = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      const res = await axios.delete(`http://localhost:65535/api/posts/${props.id}/photo`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setPhoto(res.data.src);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const checkFavorites = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (isFavorite) {
        await axios.delete(`http://localhost:65535/api/posts/${props.id}/favorite`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFavorite(false);
      } else {
        await axios.post(`http://localhost:65535/api/posts/${props.id}/favorite`, null, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFavorite(true);
      }
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const checkFollowing = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      if (isFollowed) {
        await axios.delete(`http://localhost:65535/api/posts/${props.id}/follow`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFollowed(false);
        const followersRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/followers`);
        setFollowers(followersRes.data.followers.length);
      } else {
        await axios.post(`http://localhost:65535/api/posts/${props.id}/follow`, null, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setIsFollowed(true);
        const followersRes = await axios.get(`http://localhost:65535/api/posts/${props.id}/followers`);
        setFollowers(followersRes.data.followers.length);
      }
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const lock = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.patch(`http://localhost:65535/api/posts/${props.id}/lock`, null, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setLocked(true);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const deletePost = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.delete(`http://localhost:65535/api/posts/${props.id}`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      navigate("/");
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <div className="post">
        <p className="date">{getFormattedDate(props.date)}</p>
        <div className="author">
          <Link to={`/profile/${props.authorId}/own-posts`}>
            <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${props.avatar}`} alt="User avatar" />
          </Link>
          <div className="author-name">
            <Link to={`/profile/${props.authorId}/own-posts`}>
              <p><strong>{props.fullName}</strong></p>
            </Link>
            <Link to={`/profile/${props.authorId}/own-posts`}>
              <p>@{props.login}</p>
            </Link>
          </div>
        </div>
        <div className="content">
          {props.preview === false && locked && <p>Locked</p>}
          <p><strong>{props.title}</strong></p>
          <p>{props.preview === true && props.content.length > 255 ? `${props.content.substring(0, 255)}...`:props.content}</p>
        </div>
        {photo !== null && <div>
          {props.preview === true ? <div className="bar">
            <FaPaperclip color="#000" />
            <span>Contains a picture</span>
          </div>:<>
            {!locked && user && user.id === props.authorId && <div className="cancel" onClick={unattachPhoto} title="Unattach photo">x</div>}
            <img className="post-photo" src={`${process.env.PUBLIC_URL}/images/${photo}`} alt="Attachment" />
           </>}
        </div>}
        <div className="bar categories">
          {props.categories && props.categories.map((category) => <Category key={category.id} id={category.id} title={category.title} description={category.description} />)}
        </div>
        <div className="actions">
          <div className="action">
            <button disabled={locked || props.preview === true || !user ? true:false} onClick={displayCommentForm}><FaComment color="#b3501b" /></button>
            <p>{comments}</p>
          </div>
          <div className="action">
            <button disabled={!user ? true:false} onClick={checkLike}><FaThumbsUp color={reaction === "like" ? "#4cafe4":"#b3501b"} /></button>
            <p>{likes > 0 ? <Link to={`/post/${props.id}/reactions`}>{likes}</Link>:<span>{likes}</span>}</p>
          </div>
          <div className="action">
            <button disabled={!user ? true:false} onClick={checkDislike}><FaThumbsDown color={reaction === "dislike" ? "#4cafe4":"#b3501b"} /></button>
            <p>{dislikes > 0 ? <Link to={`/post/${props.id}/reactions`}>{dislikes}</Link>:<span>{dislikes}</span>}</p>
          </div>
          {props.preview === false && user && <>
            <div className="action">
              <button onClick={checkFavorites} title={isFavorite ? "Remove from favorites":"Add to favorites"}><FaBookmark color={isFavorite ? "#4cafe4":"#b3501b"} /></button>
            </div>
            <div className="action">
              <button onClick={checkFollowing} title={isFollowed ? "Unfollow the post":"Follow the post"}><FaPlus color={isFollowed ? "#4cafe4":"#b3501b"} /></button>
              <p>{followers > 0 ? <Link to={`/post/${props.id}/followers`}>{followers} {followers === 1 ? <span>follower</span>:<span>followers</span>}</Link>:<span>{followers} followers</span>}</p>
            </div>
          </>}
          {props.preview === true && <div className="action">
            <button>
              <Link to={`/post/${props.id}`}>
                <FaEye color="#b3501b" title="View more information" />
              </Link>
            </button>
          </div>}
          {props.preview === false && user && user.id === props.authorId && <>
            <div className="action">
              <button type="button">
                <label htmlFor="photo" title="Attach a photo"><FaImage color="#b3501b" /></label>
              </button>
              <input type="file" id="photo" accept="image/*" onChange={attachPhoto} />
            </div>
            <div className="action">
              <button title="Edit">
                <Link to={`/post/${props.id}/edit`}>
                  <FaPen color="#b3501b" />
                </Link>
              </button>
            </div>
          </>}
          {props.preview === false && user && (user.id === props.authorId || user.role === "admin") && <>
            <div className="action">
              <button onClick={lock} title={locked ? "The post is locked":"Lock"}><FaLock color={locked ? "#4cafe4":"#b3501b"} /></button>
            </div>
            <div className="action">
              <button onClick={deletePost} title="Delete"><FaTrash color="#b3501b" /></button>
            </div>
          </>}
        </div>
        <form id={`commentForm${props.id}`} className="bar" style={{display: "none"}}>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your comment..."></textarea>
          <button onClick={writeComment}>Write a comment</button>
        </form>
      </div>
    </>
  );
}

export default Post;

