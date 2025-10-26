import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import '../style.css';
import { getNotifications } from "../notificationsReducer";
import Post from "./Post";
import Comment from "./Comment";
import getFormattedDate from "../getFormattedDate";

function Notification(props) {
  const [figurant, setFigurant] = useState(undefined);
  const [post, setPost] = useState(undefined);
  const [comment, setComment] = useState(undefined);
  const dispatch = useDispatch();
  useEffect(() => {
    const getInfo = async function() {
      const figurantRes = await axios.get(`http://localhost:65535/api/users/${props.figurantId}`);
      setFigurant({
        avatar: figurantRes.data.user.profile_picture,
        login: figurantRes.data.user.login,
        fullName: figurantRes.data.user.full_name
      });
      if (props.postId !== null) {
        const postRes = await axios.get(`http://localhost:65535/api/posts/${props.postId}`);
        const postAuthorRes = await axios.get(`http://localhost:65535/api/users/${postRes.data.post.author_id}`);
        postRes.data.post.author = postAuthorRes.data.user;
        const categoriesRes = await axios.get(`http://localhost:65535/api/posts/${props.postId}/categories`);
        postRes.data.post.categories = categoriesRes.data.categories;
        const commentsRes = await axios.get(`http://localhost:65535/api/posts/${props.postId}/comments`);
        postRes.data.post.commentsCount = commentsRes.data.comments.length;
        const postLikesRes = await axios.get(`http://localhost:65535/api/posts/${props.postId}/like`);
        let postDislikesCount = 0;
        let postLikesCount = 0;
        for (let i of postLikesRes.data.likes) {
          if (i.type === "like")
            postLikesCount += 1;
          else
            postDislikesCount += 1;
        }
        postRes.data.post.likesCount = postLikesCount;
        postRes.data.post.dislikesCount = postDislikesCount;
        setPost(postRes.data.post);
      }
      if (props.commentId !== null) {
        const commentRes = await axios.get(`http://localhost:65535/api/comments/${props.commentId}`);
        if (commentRes.data.comment.comment_id !== null) {
          const parentRes = await axios.get(`http://localhost:65535/api/comments/${commentRes.data.comment.comment_id}`);
          const parentAuthorRes = await axios.get(`http://localhost:65535/api/users/${parentRes.data.comment.author_id}`);
          commentRes.data.comment.parentAuthor = parentAuthorRes.data.user.login;
        }
        const commentAuthorRes = await axios.get(`http://localhost:65535/api/users/${commentRes.data.comment.author_id}`);
        commentRes.data.comment.author = commentAuthorRes.data.user;
        const commentsRes = await axios.get(`http://localhost:65535/api/comments/${props.commentId}/comments`);
        commentRes.data.comment.commentsCount = commentsRes.data.comments.length;
        const commentLikesRes = await axios.get(`http://localhost:65535/api/comments/${props.commentId}/like`);
        let commentDislikesCount = 0;
        let commentLikesCount = 0;
        for (let i of commentLikesRes.data.likes) {
          if (i.type === "like")
            commentLikesCount += 1;
          else
            commentDislikesCount += 1;
        }
        commentRes.data.comment.likesCount = commentLikesCount;
        commentRes.data.comment.dislikesCount = commentDislikesCount;
        setComment(commentRes.data.comment);
      }
    }
    getInfo();
  }, [props.commentId, props.figurantId, props.postId]);
  const readNotification = async function() {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.patch(`http://localhost:65535/api/notifications/${props.id}`, null, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
    } catch(err) {
        console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  const deleteNotification = async function() {
    try {
      let token;
      if (document.cookie)
        token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
      await axios.delete(`http://localhost:65535/api/notifications/${props.id}`, {
        headers: {authorization: token ? `Bearer ${token}`:token}
      });
      dispatch(getNotifications({
        params: {
          token: token
        }
      }));
    } catch(err) {
        console.log(err?.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <>
      <div className="notification" onLoad={readNotification}>
        <div className="cancel" onClick={deleteNotification}>x</div>
        <p className="date">{getFormattedDate(props.date)}</p>
        <div className="bar">
          {figurant && <img className="avatar-post" src={`${process.env.PUBLIC_URL}/images/${figurant.avatar}`} alt="Figurant avatar" />}
          {figurant && <p><Link to={`/profile/${props.figurantId}`}>{`@${figurant.login}`}</Link> {props.sense}</p>}
        </div>
        {post && <Post id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} photo={post.attachment === null ? undefined:post.attachment} categories={post.categories} preview={true} />}
        {comment && <Comment id={comment.id} parentId={comment.comment_id} parentAuthor={comment.parentAuthor} date={new Date(comment.publish_date)} authorId={comment.author.id} avatar={comment.author.profile_picture} fullName={comment.author.full_name} login={comment.author.login} content={comment.content} comments={comment.commentsCount} preview={true} />}
      </div>
    </>
  );
}

export default Notification;

