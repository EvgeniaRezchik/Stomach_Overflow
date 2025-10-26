const express = require("express");
const controller = require("../controllers/categories");
const router = express.Router();
router.get("/", controller.getCategories);
router.get("/:category_id", controller.getCategory);
router.get("/:category_id/posts", controller.getPosts);
router.post("/", controller.createCategory);
router.post("/:category_id/preference", controller.addToPreferences);
router.patch("/:category_id", controller.editCategory);
router.delete("/:category_id", controller.deleteCategory);
router.delete("/:category_id/preference", controller.removeFromPreferences);
module.exports = router;

