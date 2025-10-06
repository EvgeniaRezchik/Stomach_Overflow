const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Category = require('../models/category');
const controller = {
  async getCategories(req, res) {
    const limit = 10;
    let values;
    let columns;
    let params;
    let offset;
    let valuesCount = 0;
    if (req.query.title)
      valuesCount += 1;
    if (req.query.description)
      valuesCount += 1;
    if (valuesCount === 1) {
      if (req.query.title) {
        values = req.query.title;
        columns = "title";
      } else if (req.query.description) {
        values = req.query.description;
        columns = "description";
      }
      params = "LIKE";
    } else if (valuesCount > 1) {
      values = [];
      columns = [];
      params = [];
      if (req.query.title) {
        values.push(req.query.title);
        columns.push("title");
        params.push("LIKE");
      } else if (req.query.description) {
        values.push(req.query.description);
        columns.push("description");
        params.push("LIKE");
      }
    }
    const tempCategories = await Category.findAll(values, columns, params);
    if (tempCategories.length !== 0) {
      const pages = Math.ceil(tempCategories.length / limit);
      if (req.query.page) {
        if (req.query.page < 0 || req.query.page >= pages)
          offset = 0;
        else {
	  const page = Math.round(req.query.page);
	  offset = page < 0 || page >= pages ? 0:page * limit;
	}
      } 
    }
    const categories = await Category.findAll(values, columns, params,
	                                      undefined, undefined,
	                                      limit, offset);
    res.status(200).json({categories: categories});
  },
  async getCategory(req, res) {
    const category = await new Category().findOne(req.params.category_id);
    if (category.id)
      res.status(200).json({category: category});
    else
      res.status(404).json({message: "The category is not found"});
  },
  async getPosts(req, res) {
    const category = await new Category().findOne(req.params.category_id);
    if (category.id)
      res.status(200).json({posts: await category.getPosts()});
    else
      res.status(404).json({message: "The category is not found"});
  },
  async createCategory(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            if (req.user.role === "admin") {
              if (!req.body.title)
                res.status(400).json({
                  message: "Fill out at least the title field!"
                });
              else {
                const category = new Category(req.body.title,
                                              (req.body.description ?
                                               req.body.description:null));
                const result = await category.save();
                if (result !== null)
                  res.status(201).json({
                    message: "The category is successfully created!"
                  });
                else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(403).json({message: "You do not have admin rights!"});
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
  async addToPreferences(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const preferences = await req.user.getPreferences();
            const category = await new Category()
                                   .findOne(req.params.category_id);
            if (category.id) {
              if (preferences.length === 0) {
                const result = await req.user.addPreference(category.id);
                if (result)
                  res.status(200).json({message: "Added to preferences!"});
                else
                  res.status(500).json({message: "Something went wrong"});
              } else {
                for (let i of preferences) {
                  if (category.id === i.id)
                    return res.status(400).json({
                      message: "The category is already in preferences!"
                    });
                }
                const result = await req.user.addPreference(category.id);
                if (result)
                  res.status(200).json({message: "Added to preferences!"});
                else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The category is not found"});
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
  async editCategory(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const category = await new Category()
                                   .findOne(req.params.category_id);
            if (category.id) {
              if (req.user.role === "admin") {
                if (req.body.title)
                  category.title = req.body.title;
                if (req.body.description)
                  category.description = req.body.description;
                if (req.body.deleteDescription)
                  category.description = null;
                const result = await category.save();
                if (result !== null)
                  res.status(200).json({
                    message: "The category is successfully edited!"
                  });
                else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(403).json({
		  message: "You do not have admin rights!"
		});
            } else
              res.status(404).json({message: "The category is not found"});
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
  async deleteCategory(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            if (req.user.role === "admin") {
              const category = await new Category()
                                     .findOne(req.params.category_id);
              if (category.id) {
                const result = await category.deletion();
                if (result)
                  res.status(200).json({
                    message: "The category is successfully deleted!"
                  });
                else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(404).json({message: "The category is not found"});
            } else
              res.status(403).json({message: "You do not have admin rights!"});
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
  async removeFromPreferences(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const preferences = await req.user.getPreferences();
            const category = await new Category()
                                   .findOne(req.params.category_id);
            if (category.id) {
              if (preferences.length === 0)
                res.status(404).json({message: "There are no preferences"});
              else {
                for (let i of preferences) {
                  if (category.id === i.id) {
                    const result = await req.user
				            .deletePreference(category.id);
                    if (result)
                      return res.status(200).json({
                        message: "Deleted from preferences!"
                      });
                    else
                      return res.status(500).json({
                        message: "Something went wrong"
                      });
                  }
                }
                res.status(404).json({
                  message: "The category is not in preferences"
                });
              }
            } else
              res.status(404).json({message: "The category is not found"});
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

