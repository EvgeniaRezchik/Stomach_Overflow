import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import '../style.css';
import { getComments } from "../commentsReducer";
import Header from "./Header";
import Footer from "./Footer";
import Post from "./Post";
import Comment from "./Comment";

function PostPage() {
  const navigate = useNavigate();
  const {post_id} = useParams();
  const [post, setPost] = useState(undefined);
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const commentsSelector = useSelector(state => state.comments.comments);
  const commentsErrorSelector = useSelector(state => state.comments.error);
  useEffect(() => {
    async function getPost() {
      try {
        const postRes = await axios.get(`http://localhost:65535/api/posts/${post_id}`);
        const postAuthorRes = await axios.get(`http://localhost:65535/api/users/${postRes.data.post.author_id}`);
        postRes.data.post.author = postAuthorRes.data.user;
        const categoriesRes = await axios.get(`http://localhost:65535/api/posts/${post_id}/categories`);
        postRes.data.post.categories = categoriesRes.data.categories;
        const commentsRes = await axios.get(`http://localhost:65535/api/posts/${post_id}/comments`);
        postRes.data.post.commentsCount = commentsRes.data.comments.length;
        const postLikesRes = await axios.get(`http://localhost:65535/api/posts/${post_id}/like`);
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
        dispatch(getComments({
          params: {
            postId: post_id
          }
        }));
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getPost();
  }, [dispatch, navigate, post_id]);
  useEffect(() => {
    if (commentsErrorSelector) {
      setMessage(commentsErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [commentsErrorSelector, navigate]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        {post && <Post id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} photo={post.attachment === null ? undefined:post.attachment} categories={post.categories} preview={false} />}
        <h1>Comments</h1>
        {!commentsSelector || (commentsSelector && commentsSelector.length === 0) ? <p>No comments</p>:commentsSelector.map((comment) => <Comment key={comment.id} id={comment.id} parentId={comment.comment_id} parentAuthor={comment.parentAuthor} date={new Date(comment.publish_date)} authorId={comment.author.id} avatar={comment.author.profile_picture} fullName={comment.author.full_name} login={comment.author.login} content={comment.content} comments={comment.commentsCount} preview={false} />)}
      </div>
      <Footer />
    </>
  );
}

export default PostPage;

