import './style.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage";
import SignUpPage from "./components/SignUpPage";
import SignInPage from "./components/SignInPage";
import SendMailPage from "./components/SendMailPage";
import NewPasswordPage from "./components/NewPasswordPage";
import VerificationPage from "./components/VerificationPage";
import NewPostPage from "./components/NewPostPage";
import CategoryPage from "./components/CategoryPage";
import ProfilePage from "./components/ProfilePage";
import PostPage from "./components/PostPage";
import NotificationsPage from "./components/NotificationsPage";
import InfoPage from "./components/InfoPage";
import PreferencesPage from "./components/PreferencesPage";
import EditProfilePage from "./components/EditProfilePage";
import EditCategoryPage from "./components/EditCategoryPage";
import AdminPanelPage from "./components/AdminPanelPage";
import SearchPage from "./components/SearchPage";
import AboutUsPage from "./components/AboutUsPage";
import Page404 from "./components/Page404";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/send-mail" element={<SendMailPage />} />
        <Route path="/new-password/:confirm_token" element={<NewPasswordPage />} />
        <Route path="/verification/:confirm_token" element={<VerificationPage />} />
        <Route path="/create-post" element={<NewPostPage option="create" />} />
        <Route path="/category/:category_id" element={<CategoryPage />} />
        <Route path="/category/:category_id/edit" element={<EditCategoryPage />} />
        <Route path="/profile/:user_id/own-posts" element={<ProfilePage posts="own" />} />
        <Route path="/profile/:user_id/followings" element={<ProfilePage posts="followings" />} />
        <Route path="/profile/:user_id/favorites" element={<ProfilePage posts="favorites" />} />
        <Route path="/profile/:user_id/edit" element={<EditProfilePage />} />
        <Route path="/profile/:user_id/preferences" element={<PreferencesPage />} />
        <Route path="/profile/:user_id/followers" element={<InfoPage info="userFollowers" />} />
        <Route path="/profile/:user_id/followed" element={<InfoPage info="userFollowed" />} />
        <Route path="/post/:post_id" element={<PostPage />} />
        <Route path="/post/:post_id/edit" element={<NewPostPage option="edit" />} />
        <Route path="/post/:post_id/reactions" element={<InfoPage info="postReactions" />} />
        <Route path="/comment/:comment_id/reactions" element={<InfoPage info="commentReactions" />} />
        <Route path="/post/:post_id/followers" element={<InfoPage info="postFollowers" />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin-panel" element={<AdminPanelPage />} />
        <Route path="/search/:query" element={<SearchPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/*" element={<Page404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
