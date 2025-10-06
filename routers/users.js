const express = require("express");
const controller = require("../controllers/users");
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
      cb(null, Date.now() + "_avatar"
               + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.slice(0, 6) !== "image/")
      return cb(new Error("You can attach only images!"), false);
    cb(null, true);
  }
});
router.get("/", controller.getUsers);
router.get("/favorites", controller.getFavorites);
router.get("/preferences", controller.getPreferences);
router.get("/:user_id", controller.getUser);
router.get("/:user_id/followers", controller.getFollowers);
router.get("/:user_id/followed", controller.getFollowed);
router.get("/:user_id/followings", controller.getFollowings);
router.post("/", controller.createUser);
router.post("/:user_id/follow", controller.followUser);
router.patch("/avatar", (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    return err ? res.status(400).json({message: err.message}):next();
  });
}, controller.uploadAvatar);
router.patch("/:user_id", controller.editUser);
router.delete("/avatar", controller.deleteAvatar);
router.delete("/:user_id", controller.deleteUser);
router.delete("/:user_id/follow", controller.unfollowUser);
module.exports = router;

