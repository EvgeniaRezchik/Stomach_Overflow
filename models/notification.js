const Model = require("../model");

module.exports = class Notification extends Model {
  constructor(addressee_id, figurant_id,
	      post_id, comment_id, sense) {
    super("notifications");
    this.id;
    this.publish_date;
    this.addressee_id = addressee_id;
    this.figurant_id = figurant_id;
    this.post_id = post_id;
    this.comment_id = comment_id;
    this.sense = sense;
    this.is_read;
  }
  static table = "notifications";
}

