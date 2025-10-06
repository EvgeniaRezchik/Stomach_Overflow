const db = require("../db").promise();
const Model = require("../model");
const Post = require("./post");
const Comment = require("./comment");
const Like = require("./like");
const Notification = require("./notification");

module.exports = class User extends Model {
  constructor(login, password, full_name, email_address, profile_picture) {
    super("users");
    this.id;
    this.login = login;
    this.password = password;
    this.full_name = full_name;
    this.email_address = email_address;
    this.profile_picture = profile_picture;
    this.rating;
    this.role;
    this.notifications_on;
    this.email_confirmed;
  }
  static table = "users";
  addPreference(category_id) {
    const query = "INSERT INTO preferences (user_id, category_id) VALUES ("
		  + this.id + ", " + category_id + ");";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  deletePreference(category_id) {
    const query = "DELETE FROM preferences WHERE user_id = " + this.id
		  + " AND category_id = " + category_id + ";";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  followUser(user_id) {
    const query = "INSERT INTO followers (follower_id, followed_id) VALUES ("
		  + this.id + ", " + user_id + ");";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  unfollowUser(user_id) {
    const query = "DELETE FROM followers WHERE follower_id = " + this.id
		  + " AND followed_id = " + user_id + ";";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  followPost(post_id) {
    const query = "INSERT INTO followings (user_id, post_id) VALUES ("
                  + this.id + ", " + post_id + ");";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  unfollowPost(post_id) {
    const query = "DELETE FROM followings WHERE user_id = " + this.id
		  + " AND post_id = " + post_id + ";";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  addToFavorites(post_id) {
    const query = "INSERT INTO favorites (user_id, post_id) VALUES ("
                  + this.id + ", " + post_id + ");";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  removeFromFavorites(post_id) {
    const query = "DELETE FROM favorites WHERE user_id = " + this.id
		  + " AND post_id = " + post_id + ";";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  updateRating() {
    const query1 = "SELECT count(id) AS Likes FROM likes GROUP BY author_id,"
		  + " type HAVING author_id = " + this.id
		  + ' AND type = "like";';
    return db.query(query1)
    .then(res1 => {
      const likes = res1[0][0] ? res1[0][0].Likes:0;
      const query2 = "SELECT count(id) AS Dislikes FROM likes GROUP BY "
		     + "author_id, type HAVING author_id = " + this.id
		     + ' AND type = "dislike";';
      return db.query(query2)
      .then(res2 => {
        const dislikes = res2[0][0] ? res2[0][0].Dislikes:0;
        this.rating = likes - dislikes;
        return this.save()
        .then(() => {return true;})
        .catch(err => {
	  console.log(err);
	  return false;
	});
      })
      .catch(err => {
        console.log(err);
        return false;
      });
    })
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  deletion() {
    let authorsIds = new Set();
    const deleteLikes = async function(user) {
      const likes = await Like.findAll(user.id, "author_id");
      for (let i of likes) {
        const like = new Like();
        Object.assign(like, i);
        await like.delete();
        const author = new User();
        if (i.post_id !== null) {
	  const post = await new Post().findOne(i.post_id);
	  await author.findOne(post.author_id);
	} else if (i.comment_id !== null) {
	  const comment = await new Comment().findOne(i.comment_id);
	  await author.findOne(comment.author_id);
	}
        authorsIds.add(author.id);
      }
    };
    const deleteNotifications = async function(user) {
      const addresseeNotifications = await user.getNotifications();
      for (let i of addresseeNotifications) {
        const notification = new Notification();
        Object.assign(notification, i);
        await notification.delete();
      }
      const figurantNotifications = await Notification.findAll(user.id,
	                                                       "figurant_id");
      for (let i of figurantNotifications) {
        const notification = new Notification();
        Object.assign(notification, i);
        await notification.delete();
      }
    };
    const deleteComments = async function(user) {
      const comments = await Comment.findAll(user.id, "author_id");
      for (let i of comments) {
        const comment = new Comment();
        Object.assign(comment, i);
        const commentsAuthorsIds = await comment.deletion();
        for (let j of commentsAuthorsIds)
          authorsIds.add(j);
      }
    };
    const deletePosts = async function(user) {
      const posts = await user.getPosts();
      for (let i of posts) {
        const post = new Post();
        Object.assign(post, i);
        const postAuthorsIds = await post.deletion();
        for (let j of postAuthorsIds)
          authorsIds.add(j);
      }
    };
    const updateAuthorsRatings = async function() {
      for (let i of authorsIds) {
        const user = await new User().findOne(i);
        await user.updateRating();
      }
    };
    return db.query("DELETE FROM followers WHERE follower_id = ?;", this.id)
    .then(() => {
      return db.query("DELETE FROM followers WHERE followed_id = ?;", this.id)
      .then(() => {
        return db.query("DELETE FROM preferences WHERE user_id = ?;", this.id)
        .then(() => {
	  return db.query("DELETE FROM followings WHERE user_id = ?;", this.id)
	  .then(() => {
	    return db.query("DELETE FROM favorites WHERE user_id = ?;",
		            this.id)
	    .then(() => {
	      return deleteLikes(this)
	      .then(() => {
	        return deleteNotifications(this)
	        .then(() => {
		  return deleteComments(this)
		  .then(() => {
		    return deletePosts(this)
		    .then(() => {
		      return updateAuthorsRatings()
		      .then(() => {
		        return this.delete()
		        .then(() => {return true;})
		        .catch(err => {
			  console.log(err);
			  return false;
			});
		      })
		      .catch(err => {
		        console.log(err);
		        return false;
		      });
		    })
		    .catch(err => {
		      console.log(err);
		      return false;
		    });
		  })
		  .catch(err => {
		    console.log(err);
		    return false;
		  });
		})
	        .catch(err => {
		  console.log(err);
		  return false;
		});
	      })
	      .catch(err => {
	        console.log(err);
	        return false;
	      });
	    })
	    .catch(err => {
	      console.log(err);
	      return false;
	    });
	  })
	  .catch(err => {
	    console.log(err);
	    return false;
	  });
	})
        .catch(err => {
	  console.log(err);
	  return false;
	});
      })
      .catch(err => {
        console.log(err);
        return false;
      });
    })
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  getPosts() {
    return Post.findAll(this.id, "author_id")
    .then(res => {return res;})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getPreferences() {
    const query = "SELECT * FROM categories JOIN preferences "
		  + "ON preferences.category_id = categories.id"
		  + " WHERE user_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getFavorites() {
    const query = "SELECT * FROM posts JOIN favorites "
		  + "ON favorites.post_id = posts.id "
		  + "WHERE user_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getFollowings() {
    const query = "SELECT * FROM posts JOIN followings "
                  + "ON followings.post_id = posts.id "
                  + "WHERE user_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getFollowers() {
    const query = "SELECT * FROM users JOIN followers "
                  + "ON followers.follower_id = users.id "
                  + "WHERE followed_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getFollowed() {
    const query = "SELECT * FROM users JOIN followers "
                  + "ON followers.followed_id = users.id "
                  + "WHERE follower_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getNotifications() {
    return Notification.findAll(this.id, "addressee_id")
    .then(res => {return res;})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
}

