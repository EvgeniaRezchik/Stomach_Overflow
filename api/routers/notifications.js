const express = require("express");
const controller = require("../controllers/notifications");
const router = express.Router();
router.get("/", controller.getNotifications);
router.patch("/:notification_id", controller.readNotification);
router.delete("/:notification_id", controller.deleteNotification);
module.exports = router;

