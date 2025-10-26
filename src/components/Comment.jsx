import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { FaComment, FaThumbsUp, FaThumbsDown, FaPaperclip, FaEye, FaImage, FaPen, FaLock, FaTrash } from "react-icons/fa";
import '../style.css';
import { getComments } from "../commentsReducer";
import getFormattedDate from "../getFormattedDate";

function Comment(props) {
  const {post_id} = useParams();
  const [user, setUser] = useState(undefined);
  const [parentPostId, setParentPostId] = useState(0);
  const [comment, setComment] = useState("");
  const [reaction, setReaction] = useState("");
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [locked, setLocked] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    const check = async function() {
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
        const parentPostRes = await axios.get(`http://localhost:65535/api/comments/${props.id}/parent-post`);
        setParentPostId(parentPostRes.data.parentPostId);
        const commentRes = await axios.get(`http://localhost:65535/api/comments/${props.id}`);
        setPhoto(commentRes.data.comment.attachment);
        setLocked(commentRes.data.comment.status === "inactive" ? true:false);
        const reactionsRes = await axios.get(`http://localhost:65535/api/comments/${props.id}/like`);
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
      } catch(err) {
        console.log(err?.response?.data?.message || "Something went wrong");
      }
    }
    check();
  }, [props.id]);
  const displayCreationForm = function(e) {
    let creationForm = document.getElementById(`creationForm${props.id}`);
    creationForm.style.display = creationForm.style.display === "none" ? "block":"none";
  }
  const writeComment = async function(e) {
    e.preventDefault();
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.post(`http://localhost:65535/api/comments/${props.id}/comments`, {
        content: comment === "" ? undefined:comment
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      document.getElementById(`creationForm${props.id}`).style.display = "none";
      dispatch(getComments({
        params: {
          postId: post_id
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
        await axios.delete(`http://localhost:65535/api/comments/${props.id}/like`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("");
      } else {
        await axios.post(`http://localhost:65535/api/comments/${props.id}/like`, {
          type: "like"
        }, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("like");
      }
      const reactsRes = await axios.get(`http://localhost:65535/api/comments/${props.id}/like`);
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
        await axios.delete(`http://localhost:65535/api/comments/${props.id}/like`, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("");
      } else {
        await axios.post(`http://localhost:65535/api/comments/${props.id}/like`, {
          type: "dislike"
        }, {
          headers: {authorization: token ? `Bearer ${token}`:token}
        });
        setReaction("dislike");
      }
      const reactsRes = await axios.get(`http://localhost:65535/api/comments/${props.id}/like`);
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
      const commentPhoto = e.target.files[0];
      if (commentPhoto) {
        const fd = new FormData();
        fd.append("photo", commentPhoto);
        e.target.value = "";
        const res = await axios.patch(`http://localhost:65535/api/comments/${props.id}/photo`, fd, {
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
      const res = await axios.delete(`http://localhost:65535/api/comments/${props.id}/photo`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setPhoto(res.data.src);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const displayEditForm = function(e) {
    let editForm = document.getElementById(`editForm${props.id}`);
    editForm.style.display = editForm.style.display === "none" ? "block":"none";
    setComment(props.content);
  }
  const editComment = async function(e) {
    e.preventDefault();
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.patch(`http://localhost:65535/api/comments/${props.id}`, {
        content: comment === "" ? undefined:comment
      }, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      document.getElementById(`editForm${props.id}`).style.display = "none";
      dispatch(getComments({
        params: {
          postId: post_id
        }
      }));
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const lock = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.patch(`http://localhost:65535/api/comments/${props.id}/lock`, null, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      setLocked(true);
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const deleteComment = async function(e) {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.delete(`http://localhost:65535/api/comments/${props.id}`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      dispatch(getComments({
        params: {
          postId: post_id
        }
      }));
    } catch(err) {
      console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <div className="post" id={String(props.id)}>
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
          {props.parentId !== null && <a href={`#${props.parentId}`}><p>Commented on @{props.parentAuthor}:</p></a>}
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
        <div className="actions">
          <div className="action">
            <button disabled={locked || props.preview === true || !user ? true:false} onClick={displayCreationForm}><FaComment color="#b3501b" /></button>
            <p>{props.comments}</p>
          </div>
          <div className="action">
            <button disabled={!user ? true:false} onClick={checkLike}><FaThumbsUp color={reaction === "like" ? "#4cafe4":"#b3501b"} /></button>
            <p>{likes > 0 ? <Link to={`/comment/${props.id}/reactions`}>{likes}</Link>:<span>{likes}</span>}</p>
          </div>
          <div className="action">
            <button disabled={!user ? true:false} onClick={checkDislike}><FaThumbsDown color={reaction === "dislike" ? "#4cafe4":"#b3501b"} /></button>
            <p>{dislikes > 0 ? <Link to={`/comment/${props.id}/reactions`}>{dislikes}</Link>:<span>{dislikes}</span>}</p>
          </div>
          {props.preview === true && <div className="action">
            <button disabled={locked && (!user || (user && user.id !== props.authorId && user.role !== "admin")) ? true:false}>
              {locked && (!user || (user && user.id !== props.authorId && user.role !== "admin")) ? <FaEye color="#b3501b" title="This comment is locked" />:<>
                <Link to={`/post/${parentPostId}`}>
                  <FaEye color="#b3501b" title="View more information" />
                </Link>
              </>}
            </button>
          </div>}
          {props.preview === false && user && user.id === props.authorId && <>
            <div className="action">
              <button type="button" disabled={locked ? true:false}>
                <label htmlFor="photo" title="Attach a photo"><FaImage color="#b3501b" /></label>
              </button>
              <input type="file" id="photo" accept="image/*" onChange={attachPhoto} />
            </div>
            <div className="action">
              <button disabled={locked ? true:false} onClick={displayEditForm} title="Edit"><FaPen color="#b3501b" /></button>
            </div>
          </>}
          {props.preview === false && user && (user.id === props.authorId || user.role === "admin") && <>
            <div className="action">
              <button onClick={lock} title={locked ? "The comment is locked":"Lock"}><FaLock color={locked ? "#4cafe4":"#b3501b"} /></button>
            </div>
            <div className="action">
              <button onClick={deleteComment} title="Delete"><FaTrash color="#b3501b" /></button>
            </div>
          </>}
        </div>
        <form id={`creationForm${props.id}`} className="bar" style={{display: "none"}}>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your comment..."></textarea>
          <button onClick={writeComment}>Write a comment</button>
        </form>
        <form id={`editForm${props.id}`} className="bar" style={{display: "none"}}>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your comment..."></textarea>
          <button onClick={editComment}>Edit the comment</button>
        </form>
      </div>
    </>
  );
}

export default Comment;

