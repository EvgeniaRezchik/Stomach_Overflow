const jwt = require("jsonwebtoken");
const User = require('../models/user');
const Notification = require("../models/notification");
const controller = {
  async getNotifications(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id)
            res.status(200).json({
              notifications: await req.user.getNotifications()
            });
          else
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
  async readNotification(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const not = await new Notification()
                              .findOne(req.params.notification_id);
            if (not.id) {
              if (not.addressee_id !== req.user.id)
                res.status(403).json({
                  message: "This is not your notification!"
                });
              else {
                not.is_read = true;
                const result = await not.save();
                if (result !== null)
                  res.status(200).json({message: "The notification is read!"});
                else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The notification is not found"});
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
  async deleteNotification(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const not = await new Notification()
                              .findOne(req.params.notification_id);
            if (not.id) {
              if (not.addressee_id !== req.user.id)
                res.status(403).json({
                  message: "This is not your notification!"
                });
              else {
                const result = await not.delete();
                if (result !== null)
                  res.status(200).json({
                    message: "The notification is deleted!"
                  });
                else
                  res.status(500).json({message: "Something went wrong"});
              }
            } else
              res.status(404).json({message: "The notification is not found"});
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

