import '../style.css';
import Header from "./Header";
import Footer from "./Footer";
function AboutUsPage() {
  return (
    <>
      <Header />
      <div className="page-body">
        <h1>Stomach Overflow</h1>
        <p>"Stomach Overflow" is a place where you can share and ask for information about cooking... so your food will let your <strong><em>stomach overflow</em></strong>!</p>
        <hr />
        <p>Share your knowledge about dishes, cooking appliances and techniques and national cuisines with green hands and ask profies for some advice!</p>
        <img className="about-us" src={`${process.env.PUBLIC_URL}/images/post.png`} alt="Post" />
        <p>Upgrade your rank so your account will be highly-rated!</p>
        <img className="about-us" src={`${process.env.PUBLIC_URL}/images/ratings.png`} alt="Ratings" />
        <p>Choose your favorite topics!</p>
        <img className="about-us" src={`${process.env.PUBLIC_URL}/images/preferences.png`} alt="Post" />
      </div>
      <Footer />
    </>
  );
}

export default AboutUsPage;

