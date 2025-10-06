const express = require("express");
const controller = require("../controllers/auth");
const router = express.Router();
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/password-reset", controller.passwordReset);
router.post("/verification", controller.verification);
router.post("/password-reset/:confirm_token", controller.passwordResetToken);
router.post("/verification/:confirm_token", controller.verificationToken);
module.exports = router;

