const jwt = require("jsonwebtoken");
const db = require("../db").promise();
const User = require("../models/user");
const Category = require("../models/category");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Notification = require("../models/notification");
const Like = require("../models/like");
const controller = {
  async getPosts(req, res) {
    const limit = 5;
    let columns;
    let params;
    let values;
    let orderBy;
    let order;
    let valuesCounter = 0;
    let offset;
    let joinTables;
    let joinColumns1;
    let joinColumns2;
    let joinCounter = 0;
    let categoriesIds = [];
    if (req.query.date)
      valuesCounter += 1;
    if (req.query.category)
      valuesCounter += 1;
    if (req.query.status)
      valuesCounter += 1;
    if (req.query.user)
      valuesCounter += 1;
    if (req.query.title)
      valuesCounter += 1;
    if (req.query.content)
      valuesCounter += 1;
    if (valuesCounter === 1) {
      if (req.query.date) {
        if (req.query.date === "7Days") {
	  columns = "posts.publish_date";
	  params = "BETWEEN";
	  values = [[new Date(new Date().getFullYear(),
		              new Date().getMonth(),
		              new Date().getDate() - 5), new Date()]];
	} else if (req.query.date === "30Days") {
	  columns = "posts.publish_date";
	  params = "BETWEEN";
          values = [[new Date(new Date().getFullYear(),
                              new Date().getMonth(),
                              new Date().getDate() - 28), new Date()]];
	}
      } else if (req.query.category) {
        joinCounter += 1;
        if (req.query.category instanceof Array) {
	  const categories = await Category.findAll([req.query.category],
		                                    "title", "IN");
	  for (let i of categories)
	    categoriesIds.push(i.id);
	} else if (req.query.category === "preferences") {
	  if (!req.headers.authorization)
	    return res.status(401).json({
	      message: "Only authorized users can filter by preferences!"
	    });
	  else {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user) {
	          const preferences = await req.user.getPreferences();
	          if (preferences.length === 0)
	            return res.status(404).json({
	              message: "You do not have preferences"
	            });
	          else {
	            for (let i of preferences)
	              categoriesIds.push(i.id);
		  }
	        } else
	          return res.status(404).json({
	            message: "The session user is not found"
	          });
	      } else
	        return res.status(401).json({
	          message: "Your token seems to have expired"
	        });
	    } catch(err) {
	      console.log(err);
	      return res.status(401).json({
	        message: "Your token seems to have expired"
	      });
	    }
	  }
	} else {
	  const categories = await Category
                                 .findAll(req.query.category, "title",
                                          (/%/.test(req.query.category) ?
                                          "LIKE":"="));
          if (categories.length === 0)
            categoriesIds.push(0);
          else {
            for (let i of categories)
              categoriesIds.push(i.id);
          }
	}
      } else if (req.query.status) {
        if (req.query.status === "active") {
	  columns = "posts.status";
	  params = "=";
	  values = "active";
	} else {
	  if (req.headers.authorization) {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user.id) {
	          if (req.user.role !== "admin") {
	            columns = "posts.status";
	            params = "=";
	            values = "active";
	          }
	        } else {
	          columns = "posts.status";
	          params = "=";
	          values = "active";
	        }
	      } else {
	        columns = "posts.status";
	        params = "=";
	        values = "active";
	      }
	    } catch(err) {
          console.log(err);
          columns = "posts.status";
          params = "=";
          values = "active";
        }
	  } else {
	    columns = "posts.status";
	    params = "=";
	    values = "active";
	  }
	}
      } else if (req.query.user) {
        const user = await new User().findOne(req.query.user, "login");
        if (user.id) {
	  joinCounter += 1;
	  if (req.headers.authorization) {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user.id) {
	          if (req.user.id === user.id || req.user.role === "admin") {
	            columns = "users.login";
	            params = "=";
	            values = req.query.user;
	          } else {
	            columns = ["users.login", "posts.status"];
	            params = ["=", "="];
	            values = [req.query.user, "active"];
	          }
	        } else {
	          columns = ["users.login", "posts.status"];
	          params = ["=", "="];
	          values = [req.query.user, "active"];
	        }
	      } else {
	        columns = ["users.login", "posts.status"];
	        params = ["=", "="];
	        values = [req.query.user, "active"];
	      }
	    } catch(err) {
	      console.log(err);
	      columns = ["users.login", "posts.status"];
	      params = ["=", "="];
	      values = [req.query.user, "active"];
	    }
	  } else {
	    columns = ["users.login", "posts.status"];
	    params = ["=", "="];
	    values = [req.query.user, "active"];
	  }     
	} else
          return res.status(404).json({message: "The user is not found"});
      } else if (req.query.title) {
        columns = "posts.title";
        params = "LIKE";
        values = req.query.title;
      } else if (req.query.content) {
        columns = "content";
        params = "LIKE";
        values = req.query.content;
      }
    } else if (valuesCounter > 1) {
      columns = [];
      params = [];
      values = [];
      if (req.query.date) {
        if (req.query.date === "7Days") {
	  columns.push("posts.publish_date");
	  params.push("BETWEEN");
	  values.push([new Date(new Date().getFullYear(),
		              new Date().getMonth(),
		              new Date().getDate() - 5), new Date()]);
	} else if (req.query.date === "30Days") {
	  columns.push("posts.publish_date");
	  params.push("BETWEEN");
          values.push([new Date(new Date().getFullYear(),
                              new Date().getMonth(),
                              new Date().getDate() - 28), new Date()]);
	}
      }
      if (req.query.category) {
        joinCounter += 1;
        if (req.query.category instanceof Array) {
	  const categories = await Category.findAll([req.query.category],
		                                    "title", "IN");
	  for (let i of categories)
	    categoriesIds.push(i.id);
	} else if (req.query.category === "preferences") {
	  if (!req.headers.authorization)
	    return res.status(401).json({
	      message: "Only authorized users can filter by preferences!"
	    });
	  else {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user) {
	          const preferences = await req.user.getPreferences();
	          if (preferences.length === 0)
	            return res.status(404).json({
	              message: "You do not have preferences"
	            });
	          else {
	            for (let i of preferences)
	              categoriesIds.push(i.id);
		  }
	        } else
	          return res.status(404).json({
	            message: "The session user is not found"
	          });
	      } else
	        return res.status(401).json({
	          message: "Your token seems to have expired"
	        });
	    } catch(err) {
	      console.log(err);
	      return res.status(401).json({
	        message: "Your token seems to have expired"
	      });
	    }
	  }
	} else {
	  const categories = await Category
			         .findAll(req.query.category, "title",
					  (/%/.test(req.query.category) ?
					  "LIKE":"="));
	  if (categories.length === 0)
	    categoriesIds.push(0);
	  else {
	    for (let i of categories)
	      categoriesIds.push(i.id);
	  }
	}
      }
      if (req.query.status) {
        if (req.query.status === "active") {
	  columns.push("posts.status");
	  params.push("=");
	  values.push("active");
	} else {
	  if (req.headers.authorization) {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user.id) {
	          if (req.user.role !== "admin") {
	            columns.push("posts.status");
	            params.push("=");
	            values.push("active");
	          }
	        } else {
	          columns.push("posts.status");
	          params.push("=");
	          values.push("active");
	        }
	      } else {
	        columns.push("posts.status");
	        params.push("=");
	        values.push("active");
	      }
	    } catch(err) {
          console.log(err);
          columns.push("posts.status");
          params.push("=");
          values.push("active");
        }
	  } else {
	    columns.push("posts.status");
	    params.push("=");
	    values.push("active");
	  }
	}
      }
      if (req.query.user) {
        const user = await new User().findOne(req.query.user, "login");
        if (user.id) {
	  joinCounter += 1;
	  if (req.headers.authorization) {
	    try {
	      const payload = jwt.verify(req.headers.authorization
		                                    .split(" ")[1],
	                                 "userKey");
	      if (payload) {
	        req.user = await new User().findOne(payload.id);
	        if (req.user.id) {
	          if (req.user.id === user.id || req.user.role === "admin") {
	            columns.push("users.login");
	            params.push("=");
	            values.push(req.query.user);
	          } else {
	            columns.push("users.login");
	            columns.push("posts.status");
	            params.push("=");
	            params.push("=");
	            values.push(req.query.user);
	            values.push("active");
	          }
	        } else {
	          columns.push("users.login");
	          columns.push("posts.status");
	          params.push("=");
	          params.push("=");
	          values.push(req.query.user);
	          values.push("active");
	        }
	      } else {
	        columns.push("users.login");
	        columns.push("posts.status");
	        params.push("=");
	        params.push("=");
	        values.push(req.query.user);
	        values.push("active");
	      }
	    } catch(err) {
          console.log(err);
          columns.push("users.login");
          columns.push("posts.status");
          params.push("=");
          params.push("=");
          values.push(req.query.user);
          values.push("active");
        }
	  } else {
	    columns.push("users.login");
	    columns.push("posts.status");
	    params.push("=");
	    params.push("=");
	    values.push(req.query.user);
	    values.push("active");
	  }     
	} else
          return res.status(404).json({message: "The user is not found"});
      }
      if (req.query.title) {
        columns.push("posts.title");
        params.push("LIKE");
        values.push(req.query.title);
      }
      if (req.query.content) {
        columns.push("content");
        params.push("LIKE");
        values.push(req.query.content);
      }
    }
    if (req.query.orderBy) {
      if (req.query.orderBy === "likes") {
        joinCounter += 1;
        orderBy = "ratings.rating";
      } else if (req.query.orderBy === "date")
        orderBy = "publish_date";
      else if (req.query.orderBy === "authorsRating") {
        joinCounter += 1;
        orderBy = "users.rating";
      }
    } else {
      joinCounter += 1;
      orderBy = "ratings.rating";
    }
    order = req.query.order ? req.query.order:"DESC";
    if (joinCounter === 1) {
      if (req.query.category) {
        joinTables = "(SELECT DISTINCT * FROM (SELECT posts.* FROM posts JOIN"
		     + " posts_categories ON posts_categories.post_id = "
		     + "posts.id JOIN categories ON categories.id = "
		     + "posts_categories.category_id WHERE categories.id IN (";
        joinTables += categoriesIds[0];
        for (let i = 1; i < categoriesIds.length; i += 1) {
	  joinTables += ", ";
	  joinTables += categoriesIds[i];
	}
        joinTables += ")) AS posts_preferences) AS preferred";
        joinColumns1 = "preferred.id";
        joinColumns2 = "posts.id";
      } else if (orderBy && orderBy === "ratings.rating") {
        joinTables = "(SELECT post_id, max_likes.likes - max_likes.dislikes AS"
		     + " rating FROM (SELECT post_id, max(likes) AS likes, "
		     + "max(dislikes) AS dislikes FROM (SELECT post_id, CASE "
		     + "WHEN type = 'like' THEN count ELSE 0 END AS likes, "
		     + "CASE WHEN type = 'dislike' THEN count ELSE 0 END AS "
		     + "dislikes FROM (SELECT post_id, type, count(type) AS "
		     + "count FROM (SELECT likes.type AS type, posts.id AS "
		     + "post_id FROM likes RIGHT JOIN posts ON likes.post_id "
		     + "= posts.id) AS types GROUP BY post_id, type) AS "
		     + "counts) AS likes GROUP BY post_id)"
		     + " AS max_likes) AS ratings";
        joinColumns1 = "ratings.post_id";
        joinColumns2 = "posts.id";
      } else if (req.query.user || (orderBy && orderBy === "users.rating")) {
        joinTables = "users";
        joinColumns1 = "users.id";
        joinColumns2 = "posts.author_id";
      }
    } else if (joinCounter > 1) {
      joinTables = [];
      joinColumns1 = [];
      joinColumns2 = [];
      if (req.query.category) {
        let joinStr = "(SELECT DISTINCT * FROM (SELECT posts.* FROM posts "
		      + "JOIN posts_categories ON posts_categories.post_id = "
		      + "posts.id JOIN categories ON categories.id = "
		      + "posts_categories.category_id"
		      + " WHERE categories.id IN (";
        joinStr += categoriesIds[0];
        for (let i = 1; i < categoriesIds.length; i += 1) {
          joinStr += ", ";
          joinStr += categoriesIds[i];
        }
        joinStr += ")) AS posts_preferences) AS preferred";
        joinTables.push(joinStr);
        joinColumns1.push("preferred.id");
        joinColumns2.push("posts.id");
      }
      if (orderBy && orderBy === "ratings.rating") {
        joinTables.push("(SELECT post_id, max_likes.likes - max_likes.dislikes"
		        + " AS rating FROM (SELECT post_id, max(likes) AS "
		        + "likes, max(dislikes) AS dislikes FROM (SELECT "
		        + "post_id, CASE WHEN type = 'like' THEN count ELSE 0 "
		        + "END AS likes, CASE WHEN type = 'dislike' THEN count"
		        + " ELSE 0 END AS dislikes FROM (SELECT post_id, type,"
		        + " count(type) AS count FROM (SELECT likes.type AS "
		        + "type, posts.id AS post_id FROM likes RIGHT JOIN "
		        + "posts ON likes.post_id = posts.id) AS types GROUP "
		        + "BY post_id, type) AS counts) AS likes GROUP BY "
		        + "post_id) AS max_likes) AS ratings");
        joinColumns1.push("ratings.post_id");
        joinColumns2.push("posts.id");
      }
      if (req.query.user || (orderBy && orderBy === "users.rating")) {
        joinTables.push("users");
        joinColumns1.push("users.id");
        joinColumns2.push("posts.author_id");
      }
    }
    const tempPosts = await Post.findAll(values, columns, params, orderBy,
	                                 order, undefined, offset, joinTables,
	                                 joinColumns1, joinColumns2);
    if (tempPosts.length !== 0) {
      const pages = Math.ceil(tempPosts.length / limit);
      if (req.query.page) {
        if (req.query.page < 0 || req.query.page >= pages)
          offset = 0;
        else {
	  const page = Math.round(req.query.page);
	  offset = page < 0 || page >= pages ? 0:page * limit;
	}
      }
    }
    const posts = await Post.findAll(values, columns, params, orderBy,
	                             order, limit, offset,
	                             joinTables, joinColumns1, joinColumns2);
    res.json({posts: posts});
  },
  async getPost(req, res) {
    const post = await new Post().findOne(req.params.post_id);
    if (post.id)
      res.json({post: post});
    else
      res.status(404).json({message: "The post is not found"});
  },
  async getComments(req, res) {
    const post = await new Post().findOne(req.params.post_id);
    if (post.id)
      res.json({comments: await post.getAllComments()});
    else
      res.status(404).json({message: "The post is not found"});
  },
  async getCategories(req, res) {
    const post = await new Post().findOne(req.params.post_id);
    if (post.id)
      res.json({categories: await post.getCategories()});
    else
      res.status(404).json({message: "The post is not found"});
  },
  async getLikes(req, res) {
    const post = await new Post().findOne(req.params.post_id);
    if (post.id)
      res.json({likes: await post.getLikes()});
    else
      res.status(404).json({message: "The post is not found"});
  },
  async getFollowers(req, res) {
    const post = await new Post().findOne(req.params.post_id);
    if (post.id)
      res.json({followers: await post.getFollowers()});
    else
      res.status(404).json({message: "The post is not found"});
  },
  async createPost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            if (!req.body.title || !req.body.content || !req.body.categories)
              res.status(400).json({message: "Fill out all the fields!"});
            else {
              const post = new Post(req.body.title, req.body.content,
                                    req.user.id, null);
              const result1 = await post.save();
              if (result1 !== null) {
                if (typeof req.body.categories === "string") {
                  const category = await new Category()
                                         .findOne(req.body.categories,
                                                  "title");
                  if (category.id)
                    await post.addCategory(category.id);
                } else if (req.body.categories instanceof Array) {
                  for (let i = 0; i < req.body.categories.length; i += 1) {
                    const category = await new Category()
                                           .findOne(req.body.categories[i],
                                                    "title");
                    if (category.id)
                      await post.addCategory(category.id);
                  }
                }
                const followers = await req.user.getFollowers();
                for (let i of followers) {
                  if (i.notifications_on) {
                    const notification = new Notification(i.id, req.user.id,
                                                          post.id, null,
                                                          "published a"
                                                          + " post:");
                    await notification.save();
                  }
                }
                res.status(201).json({
                  message: "The post is successfully created!"
                });
              } else
                res.status(500).json({message: "Something went wrong"});
            }
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
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
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.status === "inactive")
                res.status(403).json({message: "The post is locked"});
              else {
                if (!req.body.content)
                  res(400).json({message: "Fill out the content field!"});
                else {
                  const comment = new Comment(req.user.id, req.body.content,
                                              post.id, null, null);
                  const result = await comment.save();
                  if (result !== null) {
                    const author = await new User().findOne(post.author_id);
                    if (author.id) {
                      if (author.notifications_on) {
                        const notification = new Notification(author.id,
                                                              req.user.id,
                                                              null,
                                                              comment.id,
                                                              "commented "
                                                              + "on you:");
                        await notification.save();
                      }
                    }
                    const followers = await post.getFollowers();
                    for (let i of followers) {
                      if (i.notifications_on) {
                        const notification = new Notification(i.id,
                                                              req.user.id,
                                                              null,
                                                              comment.id,
                                                              "commented on "
                                                              + "the post you"
                                                              + " are "
                                                              + "following:");
                        await notification.save();
                      }
                    }
                    res.status(201).json({
                      message: "The comment is successfully created!"
                    });
                  } else
                    res.status(500).json({message: "Something went wrong"});
                }
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async createLike(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.author_id === req.user.id)
                res.status(403).json({message: "You cannot react yourself!"});
              else {
                const query = "SELECT * FROM likes WHERE author_id = "
                              + req.user.id + " AND post_id = "
                              + post.id + ";";
                const result1 = await db.query(query);
                const like = new Like();
                if (result1[0].length !== 0)
                  await like.findOne(result1[0][0].id);
                else {
                  like.author_id = req.user.id;
                  like.post_id = post.id;
                  like.comment_id = null;
                }
                like.type = req.body.type;
                const result2 = await like.save();
                if (result2 !== null) {
                  const author = await new User().findOne(post.author_id);
                  if (author.id) {
                    const result3 = await author.updateRating();
                    if (result3) {
                      if (author.notificaions_on) {
                        const notification = new Notification(author.id,
                                                              req.user.id,
                                                              post.id, null,
                                                              "reacted to "
                                                              + "your post:");
                        await notification.save();
                      }
                      res.status(201).json({
                        message: "The like is successfully created!"
                      });
                    } else
                      res.status(500).json({message: "Something went wrong"});
                  } else
                    res.status(404).json({message: "The author is not found"});
                } else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async followPost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.status === "inactive")
                res.status(403).json({message: "The post is locked"});
              else {
                if (post.author_id === req.user.id)
                  res.status(403).json({
                    message: "You cannot follow your post!"
                  });
                else {
                  const followings = await req.user.getFollowings();
                  if (followings.length === 0) {
                    const result = await req.user.followPost(post.id);
                    if (result) {
                      const author = await new User().findOne(post.author_id);
                      if (author.id) {
                        if (author.notifications_on) {
                          const notification = new Notification(author.id,
                                                                req.user.id,
                                                                post.id, null,
                                                                "is following"
                                                                + " your "
                                                                + "post:");
                          await notification.save();
                        }
                        res.status(200).json({message: "Followed!"});
                      } else
                        res.status(404).json({
                          message: "The author is not found"
                        });
                    } else
                      res.status(500).json({message: "Something went wrong"});
                  } else {
                    for (let i of followings) {
                      if (i.id === post.id)
                        return res.status(400).json({
                          message: "The post is already followed!"
                        });
                    }
                    const result = await req.user.followPost(post.id);
                    if (result) {
                      const author = await new User().findOne(post.author_id);
                      if (author.id) {
                        if (author.notifications_on) {
                          const notification = new Notification(author.id,
                                                                req.user.id,
                                                                post.id, null,
                                                                "is following"
                                                                + " your "
                                                                + "post:");
                          await notification.save();
                        }
                        res.status(200).json({message: "Followed!"});
                      } else
                        res.status(404).json({
                          message: "The author is not found"
                        });
                    } else
                      res.status(500).json({message: "Something went wrong"});
                  }
                }
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async addToFavorites(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              const favorites = await req.user.getFavorites();
              if (favorites.length === 0) {
                const result = await req.user.addToFavorites(post.id);
                if (result)
                  res.status(200).json({message: "Added to favorites!"});
                else
                  res.status(500).json({message: "Something went wrong"});
              } else {
                for (let i of favorites) {
                  if (i.id === post.id)
                    return res.status(400).json({
                      message: "The post is already in favorites!"
                    });
                }
                const result = await req.user.addToFavorites(post.id);
                if (result)
                  res.status(200).json({message: "Added to favorites!"});
                else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async editPost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.status === "inactive")
                res.status(400).json({message: "The post is locked"});
              else {
                if (req.user.id === post.author_id) {
                  if (req.body.title)
                    post.title = req.body.title;
                  if (req.body.content)
                    post.content = req.body.content;
                  if (req.body.categories) {
                    const postCategories = await post.getCategories();
                    for (let i of postCategories) {
                      const result1 = await post.deleteCategory(i.id);
                      if (result1 === null)
                        return res.status(500).json({
                          message: "Something went wrong"
                        });
                    }
                    if (typeof req.body.categories === "string") {
                      const category = await new Category()
                                             .findOne(req.body.categories,
                                                      "title");
                      if (category.id)
                        await post.addCategory(category.id);
                    } else if (req.body.categories instanceof Array) {
                      for (let i = 0; i < req.body.categories.length; i += 1) {
                        const category = await new Category()
                                               .findOne(req.body.categories[i],
                                                        "title");
                        if (category.id)
                          await post.addCategory(category.id);
                      }
                    }
                  }
                  const result = await post.save();
                  if (result !== null)
                    res.status(200).json({
                      message: "The post is successfully edited!"
                    });
                  else
                    res.status(500).json({message: "Something went wrong"});
                } else
                  res.status(403).json({message: "You are not the author!"});
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
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
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.status === "inactive")
                res.status(403).json({message: "The post is locked"});
              else {
                if (req.user.id === post.author_id) {
                  if (req.file) {
                    post.attachment = "../public/images/" + req.file.filename;
                    const result = await post.save();
                    if (result !== null)
                      res.status(201).json({src: post.attachment});
                    else
                      res.status(500).json({message: "Something went wrong"});
                  } else
                    res.status(204).json({message: "No photo"});
                } else
                  res.status(403).json({message: "You are not the author!"});
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async lockPost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (req.user.id = post.author_id || req.user.role === "admin") {
                if (post.status === "inactive")
                  res.status(403).json({message: "The post is locked"});
                else {
                  post.status = "inactive";
                  const result = await post.save();
                  if (result !== null) {
                    const followers = await post.getFollowers();
                    for (let i of followers) {
                      if (i.notifications_on) {
                        const notification = new Notification(i.id,
                                                              req.user.id,
                                                              post.id, null,
                                                              "locked the"
                                                              + " post:");
                        await notification.save();
                      }
                    }
                    res.status(200).json({
                      message: "The post is successfully locked!"
                    });
                  } else
                    res.status(500).json({message: "Something went wrong"});
                }
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async deletePost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (req.user.id === post.author_id
                  || req.user.role === "admin") {
                const authorsIds = await post.deletion();
                if (authorsIds !== null) {
                  for (let i of authorsIds) {
                    const user = await new User().findOne(i);
                    if (user.id)
                      await user.updateRating();
                  }
                  res.status(200).json({
                    message: "The post is successfully deleted!"
                  });
                } else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
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
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              const query = "SELECT * FROM likes WHERE post_id = " + post.id
                            + " AND author_id = " + req.user.id + ";";
              const result1 = await db.query(query);
              if (result1[0]) {
                const like = new Like();
                Object.assign(like, result1[0][0]);
                const result2 = await like.delete();
                if (result2 !== null) {
                  const author = await new User().findOne(post.author_id);
                  if (author.id) {
                    const result3 = await author.updateRating();
                    if (result3)
                      res.status(200).json({
                        message: "The like is successfully deleted!"
                      });
                    else
                      res.status(500).json({message: "Something went wrong"});
                  } else
                    res.status(404).json({
                      message: "The author is not found"
                    });
                } else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(500).json({message: "Something went wrong"});
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
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
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              if (post.status === "inactive")
                res.status(403).json({message: "The post is locked"});
              else {
                if (req.user.id === post.author_id) {
                  post.attachment = null;
                  const result = await post.save();
                  if (result !== null)
                    res.status(200).json({src: post.attachment});
                  else
                    res.status(500).json({message: "Something went wrong"});
                } else
                  res.status(403).json({message: "You are not the author!"});
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async unfollowPost(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              const followings = await req.user.getFollowings();
              if (followings.length === 0)
                res.status(404).json({message: "No followings"});
              else {
                for (let i of followings) {
                  if (i.id === post.id) {
                    const result = await req.user.unfollowPost(post.id);
                    if (result)
                      return res.status(200).json({message: "Unfollowed!"});
                    else
                      return res.status(500).json({
                        message: "Something went wrong"
                      });
                  }
                }
                res.status(404).json({
                  message: "You are not following this post!"
                });
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async removeFromFavorites(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const post = await new Post().findOne(req.params.post_id);
            if (post.id) {
              const favorites = await req.user.getFavorites();
              if (favorites.length === 0)
                res.status(404).json({message: "No favorites"});
              else {
                for (let i of favorites) {
                  if (i.id === post.id) {
                    const result = await req.user
                                            .removeFromFavorites(post.id);
                    if (result)
                      return res.status(200).json({
                        message: "Removed from favorites!"
                      });
                    else
                      return res.status(500).json({
                        message: "Something went wrong"
                      });
                  }
                }
                res.status(404).json({
                  message: "This post is not in favorites"
                });
              }
            } else
              res.status(404).json({message: "The post is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        console.log(err);
        res.status(401).json({message: "Your token seems to have expired"});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  }
};
module.exports = controller;

