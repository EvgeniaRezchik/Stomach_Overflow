const Model = require("../model");

module.exports = class Like extends Model {
  constructor(author_id, post_id, comment_id, type) {
    super("likes");
    this.id;
    this.author_id = author_id;
    this.publish_date;
    this.post_id = post_id;
    this.comment_id = comment_id;
    this.type = type;
  }
  static table = "likes";
}

