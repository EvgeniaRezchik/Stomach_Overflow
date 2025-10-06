const db = require("../db").promise();
const Model = require("../model");
const Comment = require("./comment");
const Like = require("./like");
const Notification = require("./notification");

module.exports = class Post extends Model {
  constructor(title, content, author_id, attachment) {
    super("posts");
    this.id;
    this.title = title;
    this.publish_date;
    this.status;
    this.content = content;
    this.author_id = author_id;
    this.attachment = attachment;
  }
  static table = "posts";
  addCategory(category_id) {
    const query = "INSERT INTO posts_categories (post_id, category_id) "
		  + "VALUES (" + this.id + ", " + category_id + ");";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  deleteCategory(category_id) {
    const query = "DELETE FROM posts_categories WHERE post_id = "
		  + this.id + " AND category_id = " + category_id + ";";
    return db.query(query)
    .then(() => {return true;})
    .catch(err => {
      console.log(err);
      return false;
    });
  }
  deletion() {
    let authorsIds = new Set();
    const deleteComments = async function(post) {
      const directComments = await post.getDirectComments();
      for (let i of directComments) {
        const comment = new Comment();
        Object.assign(comment, i);
        const commentsAuthorsIds = await comment.deletion();
        for (let i of commentsAuthorsIds)
          authorsIds.add(i);
      }
    };
    const deleteNotifications = async function(post) {
      const notifications = await Notification.findAll(post.id, "post_id");
      for (let i of notifications) {
        const notification = new Notification();
        Object.assign(notification, i);
        await notification.delete();
      }
    };
    const deleteLikes = async function(post) {
      const likes = await post.getLikes();
      for (let i of likes) {
        const like = new Like();
        Object.assign(like, i);
        await like.delete();
      }
    };
    return db.query("DELETE FROM posts_categories WHERE post_id = ?;", this.id)
    .then(() => {
      return db.query("DELETE FROM followings WHERE post_id = ?;", this.id)
      .then(() => {
        return db.query("DELETE FROM favorites WHERE post_id = ?;", this.id)
        .then(() => {
	  return deleteComments(this)
	  .then(() => {
	    return deleteNotifications(this)
	    .then(() => {
	      return deleteLikes(this)
	      .then(() => {
	        authorsIds.add(this.author_id);
	        return this.delete()
		.then(() => {return authorsIds;})
		.catch(err => {
		  console.log(err);
		  return null;
		});
	      })
	      .catch(err => {
	        console.log(err);
	        return null;
	      });
	    })
	    .catch(err => {
	      console.log(err);
	      return null;
	    });
	  })
	  .catch(err => {
	    console.log(err);
	    return null;
	  });
	})
        .catch(err => {
	  console.log(err);
	  return null;
	});
      })
      .catch(err => {
        console.log(err);
        return null;
      });
    })
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getCategories() {
    const query = "SELECT * FROM categories JOIN posts_categories ON "
		  + "posts_categories.category_id = categories.id"
		  + " WHERE post_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getDirectComments() {
    return Comment.findAll(this.id, "post_id")
    .then(res => {return res;})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getAllComments() {
    return this.getDirectComments()
    .then(res => {
      let arr = [];
      const fillArray = async function(comments) {
        if (comments && comments.length > 0) {
	  for (let i of comments) {
	    arr.push(i);
	    let comment = new Comment();
	    Object.assign(comment, i);
	    const subcomments = await comment.getDirectComments();
	    await fillArray(subcomments);
	  }
	}
      };
      return fillArray(res)
      .then(() => {return arr;})
      .catch(err => {
        console.log(err);
        return null;
      });
    })
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getLikes() {
    return Like.findAll(this.id, "post_id")
    .then(res => {return res;})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  getFollowers() {
    const query = "SELECT * FROM users JOIN followings "
                  + "ON followings.user_id = users.id "
                  + "WHERE post_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
}

