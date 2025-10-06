const express = require("express");
const controller = require("../controllers/comments");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(path.join(__dirname, "..", "/public/images/")))
        fs.mkdirSync(path.join(__dirname, "..", "/public/images/"), {
          recursive: true
        });
      cb(null, path.join(__dirname, "..", "/public/images/"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "_photo_comment"
               + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.slice(0, 6) !== "image/")
      return cb(new Error("You can attach only images!"), false);
    cb(null, true);
  }
});
router.get("/:comment_id", controller.getComment);
router.get("/:comment_id/like", controller.getLikes);
router.post("/:comment_id/like", controller.createLike);
router.post("/:comment_id/comments", controller.createComment);
router.patch("/:comment_id", controller.editComment);
router.patch("/:comment_id/photo", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    return err ? res.status(400).json({message: err.message}):next();
  });
}, controller.attachPhoto);
router.delete("/:comment_id", controller.deleteComment);
router.delete("/:comment_id/like", controller.deleteLike);
router.delete("/:comment_id/photo", controller.unattachPhoto);
module.exports = router;

