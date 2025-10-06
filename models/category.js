const db = require("../db").promise();
const Model = require("../model");

module.exports = class Category extends Model {
  constructor(title, description) {
    super("categories");
    this.id;
    this.title = title;
    this.description = description;
  }
  static table = "categories";
  deletion() {
    return db.query("DELETE FROM posts_categories WHERE category_id = ?;",
	            this.id)
    .then(() => {
      return db.query("DELETE FROM preferences WHERE category_id = ?;",
	              this.id)
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
  }
  getPosts() {
    const query = "SELECT * FROM posts JOIN posts_categories ON "
                  + "posts_categories.post_id = posts.id"
                  + " WHERE category_id = " + this.id + ";";
    return db.query(query)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
}

