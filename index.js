const express = require("express");
const authRouter = require("./routers/auth");
const usersRouter = require("./routers/users");
const postsRouter = require("./routers/posts");
const categoriesRouter = require("./routers/categories");
const commentsRouter = require("./routers/comments");
const notificationsRouter = require("./routers/notifications");
const hostName = "localhost";
const port = 65535;
const server = express();
server.use(express.json());
server.use(express.urlencoded());
server.use("/public", express.static(__dirname + "/public"));
server.use("/api/auth", authRouter);
server.use("/api/users", usersRouter);
server.use("/api/posts", postsRouter);
server.use("/api/categories", categoriesRouter);
server.use("/api/comments", commentsRouter);
server.use("/api/notifications", notificationsRouter);
server.use((_, res) => {
  res.status(404).json({message: "The route is not found"});
});
server.listen(port, () => {
  console.log(`Server running at http://${hostName}:${port}`);
});

