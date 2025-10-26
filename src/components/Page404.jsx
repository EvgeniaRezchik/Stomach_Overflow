import { Link } from "react-router-dom";
import '../style.css';
import Header from "./Header";
import Footer from "./Footer";

function Page404() {
  return (
    <>
      <Header />
      <div className="page-body">
        <h1>404 NOT FOUND</h1>
        <p>Cooks who surf our forum see this page when some page they look for is not found.</p>
        <h2>Recipe for solution of this problem</h2>
        <h3>Ingredients</h3>
        <ul className="recipe">
          <li>This page</li>
          <li>Salt and pepper - to taste</li>
        </ul>
        <h3>Method of preparation</h3>
        <ol>
          <li>Take this page and find a link under the recipe.</li>
          <li>Go to the main page by clicking this link.</li>
        </ol>
        <Link to="/">Return to the main page</Link>
      </div>
      <Footer />
    </>
  );
}

export default Page404;

