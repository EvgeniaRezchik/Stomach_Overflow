import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
import Post from "./Post";

function CategoryPage() {
  const navigate = useNavigate();
  const {category_id} = useParams();
  const [category, setCategory] = useState(undefined);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function getCategory() {
      try {
        const categoryRes = await axios.get(`http://localhost:65535/api/categories/${category_id}`);
        setCategory(categoryRes.data.category);
        const postsRes = await axios.get(`http://localhost:65535/api/categories/${category_id}/posts`);
        if (postsRes.data.posts.length > 0) {
          for (let i = 0; i < postsRes.data.posts.length; i += 1) {
            const authorRes = await axios.get("http://localhost:65535/api/users/" + postsRes.data.posts[i].author_id);
            postsRes.data.posts[i].author = authorRes.data.user;
            const categoriesRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/categories");
            postsRes.data.posts[i].categories = categoriesRes.data.categories;
            const commentsRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/comments");
            postsRes.data.posts[i].commentsCount = commentsRes.data.comments.length;
            const likesRes = await axios.get("http://localhost:65535/api/posts/" + postsRes.data.posts[i].id + "/like");
            let dislikesCount = 0;
            let likesCount = 0;
            for (let i of likesRes.data.likes) {
              if (i.type === "like")
                likesCount += 1;
              else
                dislikesCount += 1;
            }
            postsRes.data.posts[i].likesCount = likesCount;
            postsRes.data.posts[i].dislikesCount = dislikesCount;
          }
        }
        setPosts(postsRes.data.posts);
      } catch(err) {
        setMessage(err?.response?.data?.message || "Something went wrong");
        setTimeout(() => navigate("/"), 3000);
      }
    }
    getCategory();
  }, [category_id, navigate]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        {category && <h1 className="category-block category-page">{category.title}</h1>}
        {category && <p>{category.description}</p>}
        <h1>Posts</h1>
        {!posts || (posts && posts.length <= 0) ? <p>No posts</p>:posts.map((post) => <Post key={post.id} id={post.id} date={new Date(post.publish_date)} authorId={post.author.id} avatar={post.author.profile_picture} fullName={post.author.full_name} login={post.author.login} title={post.title} content={post.content} photo={post.attachment === null ? undefined:post.attachment} categories={post.categories} preview={true} />)}
      </div>
      <Footer />
    </>
  );
}

export default CategoryPage;

