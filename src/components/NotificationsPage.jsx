import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import '../style.css';
import { getNotifications } from "../notificationsReducer";
import Header from "./Header";
import Footer from "./Footer";
import Notification from "./Notification";

function NotificationsPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const notificationsSelector = useSelector(state => state.notifications.notifications);
  const notificationsErrorSelector = useSelector(state => state.notifications.error);
  useEffect(() => {
    let token;
    if (document.cookie)
      token = decodeURIComponent(document.cookie.substring("User=".length, document.cookie.length));
    else {
      setMessage("You are not authorized!");
      setTimeout(() => navigate("/"), 3000);
    }
    dispatch(getNotifications({
      params: {
        token: token
      }
    }));
  }, [dispatch, navigate]);
  useEffect(() => {
    if (notificationsErrorSelector) {
      setMessage(notificationsErrorSelector);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate, notificationsErrorSelector]);
  return (
    <>
      <Header />
      <div className="page-body">
        {message && <div className="message">{message}</div>}
        <h1>Notifications</h1>
        {notificationsSelector.length === 0 ? <p>No notifications</p>: notificationsSelector.map((notification) => <Notification key={notification.id} id={notification.id} date={new Date(notification.publish_date)} figurantId={notification.figurant_id} sense={notification.sense} postId={notification.post_id} commentId={notification.comment_id} read={notification.is_read} />)}
      </div>
      <Footer />
    </>
  );
}

export default NotificationsPage;

