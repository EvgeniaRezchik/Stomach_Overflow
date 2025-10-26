const express = require("express");
const controller = require("../controllers/posts");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(path.join(__dirname, "..", "..", "/public/images/")))
        fs.mkdirSync(path.join(__dirname, "..", "..", "/public/images/"), {
          recursive: true
        });
      cb(null, path.join(__dirname, "..", "..", "/public/images/"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "_photo_post"
               + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.slice(0, 6) !== "image/")
      return cb(new Error("You can attach only images!"), false);
    cb(null, true);
  }
});
router.get("/", controller.getPosts);
router.get("/:post_id", controller.getPost);
router.get("/:post_id/comments", controller.getComments);
router.get("/:post_id/categories", controller.getCategories);
router.get("/:post_id/like", controller.getLikes);
router.get("/:post_id/followers", controller.getFollowers);
router.post("/", controller.createPost);
router.post("/:post_id/comments", controller.createComment);
router.post("/:post_id/like", controller.createLike);
router.post("/:post_id/follow", controller.followPost);
router.post("/:post_id/favorite", controller.addToFavorites);
router.patch("/:post_id", controller.editPost);
router.patch("/:post_id/photo", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    return err ? res.status(400).json({message: err.message}):next();
  });
}, controller.attachPhoto);
router.patch("/:post_id/lock", controller.lockPost);
router.delete("/:post_id", controller.deletePost);
router.delete("/:post_id/like", controller.deleteLike);
router.delete("/:post_id/photo", controller.unattachPhoto);
router.delete("/:post_id/follow", controller.unfollowPost);
router.delete("/:post_id/favorite", controller.removeFromFavorites);
module.exports = router;

