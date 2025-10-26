const Model = require("../model");
const Like = require("./like");
const Notification = require("./notification");

module.exports = class Comment extends Model {
  constructor(author_id, content, post_id, comment_id, attachment) {
    super("comments");
    this.id;
    this.author_id = author_id;
    this.publish_date;
    this.status;
    this.content = content;
    this.post_id = post_id;
    this.comment_id = comment_id;
    this.attachment = attachment;
  }
  static table = "comments";
  deletion() {
    let authorsIds = new Set();
    const deleteNotifications = async function(comment) {
      const notifications = await Notification.findAll(comment.id,
	                                               "comment_id");
      for (let i of notifications) {
        const notification = new Notification();
        Object.assign(notification, i);
        await notification.delete();
      }
    };
    const deleteLikes = async function(comment) {
      const likes = await comment.getLikes();
      for (let i of likes) {
        const like = new Like();
        Object.assign(like, i);
        await like.delete();
      }
    };
    const deleteComments = async function(comment) {
      const comments = await comment.getAllComments();
      for (let i = comments.length - 1; i >= 0; i -= 1) {
        const com = new Comment();
        Object.assign(com, comments[i]);
        await deleteNotifications(com);
        await deleteLikes(com);
        authorsIds.add(com.author_id);
        await com.delete();
      }
    };
    return deleteNotifications(this)
    .then(() => {
      return deleteLikes(this)
      .then(() => {
        return deleteComments(this)
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
  }
  getParentPost() {
    const findParentPost = async function(comment) {
      const comm = await new Comment().findOne(comment.id);
      while (comm.post_id === null)
        await comm.findOne(comm.comment_id);
      return comm.post_id;
    };
    return findParentPost(this)
    .then(id => {return id;})
    .catch(err => {
      console.log(err);
      return 0;
    });
  }
  getDirectComments() {
    return Comment.findAll(this.id, "comment_id", undefined, "ratings.rating",
                           "DESC", undefined, undefined, "(SELECT comment,"
                           + " max_likes.likes - max_likes.dislikes AS rating"
                           + " FROM (SELECT comment, max(likes) AS likes, "
                           + "max(dislikes) AS dislikes FROM (SELECT "
                           + "comment, CASE WHEN type = 'like' THEN count "
                           + "ELSE 0 END AS likes, CASE WHEN type = 'dislike'"
                           + " THEN count ELSE 0 END AS dislikes FROM (SELECT"
                           + " comment, type, count(type) AS count FROM "
                           + "(SELECT likes.type AS type, comments.id AS "
                           + "comment FROM likes RIGHT JOIN comments ON "
                           + "likes.comment_id = comments.id) AS types GROUP "
                           + "BY comment, type) AS counts) AS likes GROUP "
                           + "BY comment) AS max_likes) AS ratings",
                           "ratings.comment", "comments.id")
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
    return Like.findAll(this.id, "comment_id")
    .then(res => {return res;})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
}

