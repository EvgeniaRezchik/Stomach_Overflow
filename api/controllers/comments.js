const jwt = require("jsonwebtoken");
const db = require("../db").promise();
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Notification = require("../models/notification");
const Like = require("../models/like");
const controller = {
  async getComment(req, res) {
    const comment = await new Comment().findOne(req.params.comment_id);
    if (comment.id)
      res.status(200).json({comment: comment});
    else
      res.status(404).json({message: "The comment is not found"});
  },
  async getComments(req, res) {
    const comment = await new Comment().findOne(req.params.comment_id);
    if (comment.id)
      res.status(200).json({comments: await comment.getAllComments()});
    else
      res.status(404).json({message: "The comment is not found"});
  },
  async getParentPost(req, res) {
    const comment = await new Comment().findOne(req.params.comment_id);
    if (comment.id)
      res.status(200).json({parentPostId: await comment.getParentPost()});
    else
      res.status(404).json({message: "The comment is not found"});
  },
  async getLikes(req, res) {
    const comment = await new Comment().findOne(req.params.comment_id);
    if (comment.id)
      res.status(200).json({likes: await comment.getLikes()});
    else
      res.status(404).json({message: "The comment is not found"});
  },
  async createLike(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment().findOne(req.params.comment_id);
            if (comment.id) {
              if (comment.author_id === req.user.id)
                res.status(403).json({
                  message: "You cannot react to yourself!"
                });
              else {
                const query = "SELECT * FROM likes WHERE author_id = "
                              + req.user.id + " AND comment_id = "
                              + comment.id + ";";
                const result1 = await db.query(query);
                const like = new Like();
                if (result1[0].length !== 0)
                  await like.findOne(result1[0][0].id);
                else {
                  like.author_id = req.user.id;
                  like.post_id = null;
                  like.comment_id = comment.id;
                }
                if (!req.body.type)
                  return res.status(400).json({
                    message: "There is no type of reaction!"
                  });
                if (typeof req.body.type !== "string"
                    || (typeof req.body.type === "string"
                        && req.body.type.toLowerCase() !== "like"
                        && req.body.type.toLowerCase() !== "dislike"))
                  return res.status(400).json({
                    message: "Invalid type of reaction!"
                  });
                like.type = req.body.type;
                const result2 = await like.save();
                if (result2 !== null) {
                  const author = await new User().findOne(comment.author_id);
                  if (author.id) {
                    const result3 = await author.updateRating();
                    if (result3) {
                      if (author.notifications_on) {
                        const notification = new Notification(author.id,
                                                              req.user.id,
                                                              null,
                                                              comment.id,
                                                              "reacted to "
                                                              + "your "
                                                              + "comment:");
                        await notification.save();
                      }
                      res.status(201).json({
                        message: "The like is successfully created!",
                        likeId: result2
                      });
                    } else
                      res.status(500).json({message: "Something went wrong"});
                  } else
                    res.status(404).json({message: "The author is not found"});
                } else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async createComment(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const parentComment = await new Comment()
                                        .findOne(req.params.comment_id);
            if (parentComment.id) {
              if (parentComment.status === "inactive")
                res.status(403).json({
                  message: "The parent comment is locked"
                });
              else {
                const parentPostId = await parentComment.getParentPost();
                const parentPost = await new Post().findOne(parentPostId);
                if (parentPost.id) {
                  if (parentPost.status === "inactive")
                    res.status(403).json({message: "The post is locked"});
                  else {
                    if (!req.body.content)
                      res.status(400).json({
                        message: "Fill out the content field!"
                      });
                    else {
                      const comment = new Comment(req.user.id,
                                                  req.body.content,
                                                  null, parentComment.id,
                                                  null);
                      const result = await comment.save();
                      if (result !== null) {
                        const author = await new User()
                                       .findOne(parentComment.author_id);
                        if (author.id) {
                          if (author.notifications_on
                              && author.id !== req.user.id) {
                            const notification = new Notification(author.id,
                                                                  req.user.id,
                                                                  null,
                                                                  comment.id,
                                                                  "commented "
                                                                  + "on "
                                                                  + "you:");
                            await notification.save();
                          }
                        }
                        const followers = await parentPost.getFollowers();
                        for (let i of followers) {
                          if (i.notifications_on && i.id !== author.id) {
                            const notification = new Notification(i.id,
                                                                  req.user.id,
                                                                  null,
                                                                  comment.id,
                                                                  "commented "
                                                                  + "on the "
                                                                  + "post you"
                                                                  + " are "
                                                                  + "follo"
                                                                  + "wing:");
                            await notification.save();
                          }
                        }
                        res.status(201).json({
                          message: "The comment is successfully created!",
                          commentId: result
                        });
                      } else
                        res.status(500).json({
                          message: "Something went wrong"
                        });
                    }
                  }
                } else
                  res.status(404).json({
                    message: "The parent post is not found"
                  });
              }
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async editComment(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment()
                                  .findOne(req.params.comment_id);
            if (comment.id) {
              if (comment.status === "inactive")
                res.status(403).json({message: "The comment is locked"});
              else {
                const parentPostId = await comment.getParentPost();
                const parentPost = await new Post().findOne(parentPostId);
                if (parentPost.id) {
                  if (parentPost.status === "inactive")
                    res.status(403).json({
                      message: "The parent post is locked"
                    });
                  else {
                    if (req.user.id === comment.author_id) {
                      if (req.body.content) {
                        comment.content = req.body.content;
                        const result = await comment.save();
                        if (result !== null)
                          res.status(200).json({
                            message: "The comment is successfully edited!"
                        });
                        else
                          res.status(500).json({
                            message: "Something went wrong"
                          });
                      } else
                        res.status(204).json({message: "No data"});
                    } else
                      res.status(403).json({
                        message: "You are not the author!"
                      });
                  }
                } else
                  res.status(404).json({
                    message: "The parent post is not found"
                  });
              }
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async attachPhoto(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment().findOne(req.params.comment_id);
	        if (comment.id) {
	          if (comment.status === "inactive")
                res.status(403).json({message: "The comment is locked"});
              else {
                const parentPostId = await comment.getParentPost();
                const parentPost = await new Post().findOne(parentPostId);
                if (parentPost.id) {
                  if (parentPost.status === "inactive")
                    res.status(403).json({
                      message: "The parent post is locked"
                    });
                  else {
                    if (req.user.id === comment.author_id) {
                      if (req.file) {
                        comment.attachment = req.file.filename;
                        const result = await comment.save();
                        if (result !== null)
                          res.status(201).json({src: comment.attachment});
                        else
                          res.status(500).json({
                            message: "Something went wrong"
                          });
                      } else
                        res.status(204).json({message: "No photo"});
                    } else
                      res.status(403).json({
                        message: "You are not the author!"
                      });
                  }
                } else
                  res.status(404).json({
                    message: "The parent post is not found"
                  });
              }
	        } else
	          res.status(404).json({message: "The comment is not found"});
	      } else
	        res.status(404).json({
		  message: "The session user is not found"
		});
	    } else
	      res.status(401).json({
	        message: "Your token seems to have expired"
	      });
	  } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async lockComment(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment().findOne(req.params.comment_id);
            if (comment.id) {
              if (req.user.id === comment.author_id
                  || req.user.role === "admin") {
                if (comment.status === "inactive")
                  res.status(403).json({message: "The comment is locked"});
                else {
                  comment.status = "inactive";
                  const result = await comment.save();
                  if (result !== null) {
                    res.status(200).json({
                      message: "The comment is successfully locked!"
                    });
                  } else
                    res.status(500).json({message: "Something went wrong"});
                }
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async deleteComment(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user) {
            const comment = await new Comment().findOne(req.params.comment_id);
            if (comment.id) {
              if (req.user.role === "admin"
                  || comment.author_id === req.user.id) {
                const authorsIds = await comment.deletion();
                if (authorsIds !== null) {
                  for (let i of authorsIds) {
                    const user = await new User().findOne(i);
                    if (user.id)
                      await user.updateRating();
                  }
                  res.status(200).json({
                    message: "The comment is successfully deleted!"
                  });
                } else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async deleteLike(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment().findOne(req.params.comment_id);
            if (comment.id) {
              const query = "SELECT * FROM likes WHERE comment_id = "
                            + comment.id + " AND author_id = "
                            + req.user.id + ";";
              const result1 = await db.query(query);
              if (result1[0]) {
                const like = new Like();
                Object.assign(like, result1[0][0]);
                if (!like.id)
                  return res.status(400).json({
                    message: "You have not reacted to this comment"
                  });
                const result2 = await like.delete();
                if (result2 !== null) {
                  const author = await new User().findOne(comment.author_id);
                  if (author.id) {
                    const result3 = await author.updateRating();
                    if (result3)
                      res.status(200).json({
                        message: "The like is successfully deleted!"});
                    else
                      res.status(500).json({message: "Something went wrong"});
                  } else
                    res.status(404).json({message: "The author is not found"});
                } else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(500).json({message: "Something went wrong"});
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async unattachPhoto(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const comment = await new Comment().findOne(req.params.comment_id);
            if (comment.id) {
              if (comment.status === "inactive")
                res.status(403).json({message: "The comment is locked"});
              else {
                const parentPostId = await comment.getParentPost();
                const parentPost = await new Post().findOne(parentPostId);
                if (parentPost.id) {
                  if (parentPost.status === "inactive")
                    res.status(403).json({
                      message: "The parent post is locked"
                    });
                  else {
                    if (req.user.id === comment.author_id) {
                      comment.attachment = null;
                      const result = await comment.save();
                      if (result !== null)
                        res.status(200).json({src: comment.attachment});
                      else
                        res.status(500).json({
                          message: "Something went wrong"
                        });
                    } else
                      res.status(403).json({
                        message: "You are not the author!"
                      });
                  }
                } else
                  res.status(404).json({
                    message: "The parent post is not found"
                  });
              }
            } else
              res.status(404).json({message: "The comment is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  }
};
module.exports = controller;

