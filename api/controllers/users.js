const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Notification = require("../models/notification");
const createCode = function() {
  let num = Math.floor(Math.random() * 999999);
  let str = "";
  while (Math.floor(num / 10) !== 0) {
    str += num % 10;
    num = Math.floor(num / 10);
  }
  str += num;
  let code = "";
  for (let i = 0; i < 6 - str.length; i += 1)
    code += "0";
  for (let i = str.length - 1; i >= 0; i -= 1)
    code += str[i];
  return code;
};
const controller = {
  async getUsers(req, res) {
    let limit = 10;
    let values;
    let columns;
    let params;
    let offset;
    let valuesCount = 0;
    let pages = 0;
    let page = 0;
    if (req.query.login && !(req.query.login instanceof Array))
      valuesCount += 1;
    if (req.query.fullName && !(req.query.fullName instanceof Array))
      valuesCount += 1;
    if (valuesCount === 1) {
      if (req.query.login && !(req.query.login instanceof Array)) {
        values = req.query.login;
        columns = "login";
      } else if (req.query.fullName
                 && !(req.query.fullName instanceof Array)) {
        values = req.query.fullName;
        columns = "full_name";
      }
      params = "LIKE";
    } else if (valuesCount > 1) {
      values = [];
      columns = [];
      params = [];
      if (req.query.login && !(req.query.login instanceof Array)) {
        values.push(req.query.login);
        columns.push("login");
        params.push("LIKE");
      }
      if (req.query.fullName && !(req.query.fullName instanceof Array)) {
        values.push(req.query.fullName);
        columns.push("full_name");
        params.push("LIKE");
      }
    }
    const tempUsers = await User.findAll(values, columns, params);
    if (tempUsers.length !== 0) {
      pages = Math.ceil(tempUsers.length / limit);
      if (req.query.page) {
        page = Number(req.query.page);
        if (page < 0)
          page = 0;
        else if (page >= pages)
          page = pages - 1;
        else
          page = Math.floor(page);
        offset = page * limit;
      } else
        limit = undefined;
    }
    const users = await User.findAll(values, columns, params, undefined,
	                             undefined, limit, offset);
    res.status(200).json({
      users: users,
      pages: pages,
      page: page
    });
  },
  async getUser(req, res) {
    const user = await new User().findOne(req.params.user_id);
    if (user.id)
      res.status(200).json({user: user});
    else
      res.status(404).json({message: "The user is not found"});
  },
  async getFollowers(req, res) {
    const user = await new User().findOne(req.params.user_id);
    if (user.id)
      res.status(200).json({followers: await user.getFollowers()});
    else
      res.status(404).json({message: "The user is not found"});
  },
  async getFollowed(req, res) {
    const user = await new User().findOne(req.params.user_id);
    if (user.id)
      res.status(200).json({followedUsers: await user.getFollowed()});
    else
      res.status(404).json({message: "The user is not found"});
  },
  async getFollowings(req, res) {
    const user = await new User().findOne(req.params.user_id);
    if (user.id)
      res.status(200).json({followings: await user.getFollowings()});
    else
      res.status(404).json({message: "The user is not found"});
  },
  async getFavorites(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id)
            res.status(200).json({favorites: await req.user.getFavorites()});
          else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async getPreferences(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id)
            res.status(200).json({
              preferences: await req.user.getPreferences()
            });
          else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async createUser(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            if (req.user.role === "admin") {
              if (!req.body.fullName || !req.body.login
                  || !req.body.email || !req.body.pass
                  || !req.body.repass || !req.body.role)
                res.status(400).json({message: "Fill out all the fields!"});
              else {
                const user = new User();
                await user.findOne(req.body.login, "login");
                if (user.login)
                  res.status(400).json({
                    message: "This login is already used!"
                  });
                else {
                  await user.findOne(req.body.email, "email_address");
                  if (user.email_address)
                    res.status(400).json({
                      message: "This e-mail address is already used!"
                    });
                  else {
                    if (/\W/.test(req.body.login))
                      res.status(400).json({
                        message: "The login can contain only "
                                 + 'letters, digits and "_"!'
                      });
                    else if (req.body.login.length > 30)
                      res.status(400).json({
                        message: "The login must contain up to 30 characters!"
                      });
                    else if (req.body.fullName.length > 30)
                      res.status(400).json({
                        message: "The full name must contain "
                                 + "up to 30 characters!"
                      });
                    else if (!/\d/.test(req.body.pass)
                             || !/[A-Z]/.test(req.body.pass)
                             || !/[a-z]/.test(req.body.pass))
                      res.status(400).json({
                        message: "The password must contain letters "
                                 + "in both upper and lower case and numbers!"
                      });
                    else if (req.body.pass.length < 8)
                      res.status(400).json({
                        message: "The password must contain "
                                 + "at least 8 characters!"
                      });
                    else if (req.body.pass !== req.body.repass)
                      res.status(400).json({message: "Password mismatch!"});
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                              .test(req.body.email))
                      res.status(400).json({
                        message: "The e-mail address must be valid!"
                      });
                    else if (req.body.email.length > 255)
                      res.status(400).json({
                        message: "The e-mail address must contain "
                                 + "up to 255 characters!"
                      });
                    else {
                      const salt = "Salt and pepper - to taste";
                      const hash = crypto.createHmac("sha512", salt);
                      hash.update(req.body.pass);
                      user.password = hash.digest("hex");
                      user.login = req.body.login;
                      user.full_name = req.body.fullName;
                      user.email_address = req.body.email;
                      user.role = req.body.role;
                      user.profile_picture = "default_avatar.png";
                      const result = await user.save();
                      if (result !== null)
                        res.status(201).json({
                          message: "The user is successfully created!",
                          userId: result
                        });
                      else
                        res.status(500).json({
                          message: "Something went wrong"
                        });
                    }
                  }
                }
              }
            } else
              res.status(403).json({message: "You do not have admin rights!"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async followUser(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const user = await new User().findOne(req.params.user_id);
            if (user.id) {
              if (user.id === req.user.id)
                res.status(403).json({message: "You cannot follow yourself!"});
              else {
                const followed = await req.user.getFollowed();
                if (followed.length === 0) {
                  const result = await req.user.followUser(user.id);
                  if (result) {
                    if (user.notifications_on) {
                      const notification = new Notification(user.id,
                                                            req.user.id,
                                                            null, null,
                                                            "is following"
                                                            + " you!");
                      await notification.save();
                    }
                    res.status(200).json({message: "Followed!"});
                  } else
                    res.status(500).json({message: "Something went wrong"});
                } else {
                  for (let i of followed) {
                    if (i.id === user.id)
                      return res.status(400).json({
                        message: "The user is already followed"
                      });
                  }
                  const result = await req.user.followUser(user.id);
                  if (result) {
                    if (user.notifications_on) {
                      const notification = new Notification(user.id,
                                                            req.user.id,
                                                            null, null,
                                                            "is following"
                                                            + " you!");
                      await notification.save();
                    }
                    res.status(200).json({message: "Followed!"});
                  } else
                    res.status(500).json({message: "Something went wrong"});
                }
              }
            } else
              res.status(404).json({message: "The user is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async uploadAvatar(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            if (!req.file)
              res.status(400).json({message: "No file was chosen!"});
            else {
              req.user.profile_picture = req.file.filename;
              const result = await req.user.save();
              if (result !== null)
                res.status(201).json({src: req.user.profile_picture});
              else
                res.status(500).json({message: "Something went wrong"});
            }
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async editUser(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const user = await new User().findOne(req.params.user_id);
            if (user.id) {
              if (req.user.role === "admin" || user.id === req.user.id) {
                const initialEmail = user.email_address;
                if (req.body.login) {
                  if (/\W/.test(req.body.login))
                    return res.status(400).json({
                      message: "The login can contain only "
                               + 'letters, digits and "_"!'
                    });
                  else if (req.body.login.length > 30)
                    return res.status(400).json({
                      message: "The login must contain up to 30 characters!"
                    });
                  else {
                    const existent = await new User().findOne(req.body.login,
                                                              "login");
                    if (existent.login && existent.id !== user.id)
                      return res.status(400).json({
                        message: "This login is already used!"
                      });
                    else
                      user.login = req.body.login;
                  }
                }
                if (req.body.fullName) {
                  if (req.body.fullName.length > 30)
                    return res.status(400).json({
                      message: "The full name must "
                               + "contain up to 30 characters!"
                    });
                  else
                    user.full_name = req.body.fullName;
                }
                if (req.body.email && req.body.email !== initialEmail) {
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email))
                    return res.status(400).json({
                      message: "The e-mail address must be valid!"
                    });
                  else if (req.body.email.length > 255)
                    return res.status(400).json({
                      message: "The e-mail address must contain"
                               + " up to 255 characters!"
                    });
                  else {
                    const existent = await new User().findOne(req.body.email,
                                                              "email_address");
                    if (existent.id && existent.id !== user.id)
                      return res.status(400).json({
                        message: "This e-mail address is already used!"
                      });
                    else {
                      user.email_address = req.body.email;
                      user.email_confirmed = false;
                    }
                  }
                }
                if (req.body.pass && req.body.repass) {
                  if (!/\d/.test(req.body.pass) || !/[A-Z]/.test(req.body.pass)
                      || !/[a-z]/.test(req.body.pass))
                    return res.status(400).json({
                      message: "The password must contain letters "
                               + "in both upper and lower case and numbers!"
                    });
                  else if (req.body.pass.length < 8)
                    return res.status(400).json({
                      message: "The password must contain"
                               + " at least 8 characters!"
                    });
                  else if (req.body.pass !== req.body.repass)
                    return res.status(400).json({
                      message: "Password mismatch!"
                    });
                  else {
                    const salt = "Salt and pepper - to taste";
                    const hash = crypto.createHmac("sha512", salt);
                    hash.update(req.body.pass);
                    user.password = hash.digest("hex");
                  }
                } else if ((req.body.pass && !req.body.repass)
                           || (!req.body.pass && req.body.repass))
                  return res.status(400).json({
                    message: "If you change your password, "
                             + "there must be both password and confirmation!"
                  });
                if (req.body.role) {
                  if (req.user.role === "admin")
                    user.role = req.body.role;
                  else
                    return res.status(403).json({
                      message: "You do not have admin rights!"
                    });
                }
                if (req.body.notificationsOn !== undefined
                    && (typeof req.body.notificationsOn === "boolean"
                        || (typeof req.body.notificationsOn === "number"
                            && (req.body.notificationsOn === 1
                            || req.body.notificationsOn === 0))
                        || (typeof req.body.notificationsOn === "string"
                            && (req.body.notificationsOn
                                        .toLowerCase() === "true"
                                || req.body.notificationsOn
                                           .toLowerCase() === "1"
                                || req.body.notificationsOn
                                           .toLowerCase() === "false"
                                || req.body.notificationsOn
                                           .toLowerCase() === "0"))))
                  user.notifications_on = req.body.notificationsOn === true
                                          || req.body.notificationsOn === 1
                                          || (typeof req.body.notificationsOn === "string"
                                              && (req.body.notificationsOn
                                                    .toLowerCase() === "true"
                                                  || req.body.notificationsOn
                                                        .toLowerCase() === "1")) ?
                                          true:false;
                const result = await user.save();
                if (result !== null) {
                  if (req.body.email && (req.body.email !== initialEmail
                      || (req.body.email === initialEmail && !user.email_confirmed))
                      && user.id === req.user.id) {
                    const code = createCode();
                    const transporter = nodemailer.createTransport({
                      service: "gmail",
                      auth: {
                        user: "geniarezchik@gmail.com",
                        pass: "vjls vpwi whqj zehj "
                      }
                    });
                    transporter.sendMail({
                      from: '"Stomach Overflow"<geniarezchik@gmail.com>',
                      to: user.email_address,
                      subject: "Your e-mail address verification code",
                      html: `<!doctype html> <html lang="en"> <head> <style>
                            @import
                            url('https://fonts.cdnfonts.com/css/nunito');
                            body, .content, .general {align-items: center;
                            display: flex; flex-flow: column nowrap;
                            justify-content: center;}
                            h1, h2, p {font-family: "Nunito", sans-serif;}
                            h1 {background-color: #b3501b;
                            border-start-end-radius: 20px;
                            border-start-start-radius: 20px; color: #fff;
                            margin: 0; padding: 25px 0;
                            text-align: center; width: 100%;}
                            .code {color: #b3501b; font-size: 35px;
                            margin: 0 0 10px 0;}
                            .content {border-bottom: 3px solid #ccc;
                            border-end-end-radius: 20px;
                            border-end-start-radius: 20px;
                            border-left: 3px solid #ccc;
                            border-right: 3px solid #ccc; padding: 10px;}
                            .footer {color: #555;}
                            .general {width: 600px;} </style> </head> <body>
                            <div class="general"> <h1>Stomach Overflow</h1>
                            <div class="content">
                            <h2>Your verification code</h2>
                            <p>Here is your one-time code to verify your 
                            e-mail address associated with your Stomach 
                            Overflow account. It expires in 15 minutes. Don't 
                            share this code with anyone!</p>
                            <p class="code">${code}</p> </div>
                            <p class="footer">Stomach Overflow 2025</p>
                            </div> </body> </html>`
                    }, (err, info) => {
                      if (err) {
                        console.log(err.message);
                        res.status(500).json({
                          message: "Something went wrong"
                        });
                      } else {
                        const token = jwt.sign({
                          user_id: user.id,
                          user_email: user.email_address,
                          code: code
                        }, "VerificationCodeKey", {
                          expiresIn: "15m"
                        });
                        res.status(200).json({
                          message: "The verification code is sent to "
                                   + "your e-mail address!",
                          token: token,
                          notifications: user.notifications_on
                        });
                      }
                    });
                  } else
                    res.status(200).json({
                      message: "The profile is successfully edited!",
                      notifications: user.notifications_on
                    });
                } else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The user is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async deleteAvatar(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            req.user.profile_picture = "default_avatar.png";
            const result = await req.user.save();
            if (result !== null)
              res.status(200).json({src: req.user.profile_picture});
            else
              res.status(500).json({message: "Something went wrong"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async deleteUser(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const user = await new User().findOne(req.params.user_id);
            if (user.id) {
              if (user.id === req.user.id || req.user.role === "admin") {
                const result = await user.deletion();
                if (result)
                  res.status(200).json({
                    message: "The user is successfully deleted!"
                  });
                else
                  res.status(500).json({message: "Something went wrong"});
              } else
                res.status(403).json({message: "You do not have rights!"});
            } else
              res.status(404).json({message: "The user is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  },
  async unfollowUser(req, res) {
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload) {
          req.user = await new User().findOne(payload.id);
          if (req.user.id) {
            const user = await new User().findOne(req.params.user_id);
            if (user.id) {
              if (user.id === req.user.id)
                res.status(403).json({
                  message: "You cannot unfollow yourself!"
                });
              else {
                const followed = await req.user.getFollowed();
                if (followed.length === 0)
                  res.status(404).json({message: "No followed users"});
                else {
                  for (let i of followed) {
                    if (i.id === user.id) {
                      const result = await req.user.unfollowUser(user.id);
                      if (result)
                        return res.status(200).json({message: "Unfollowed!"});
                      else
                        return res.status(500).json({
                          message: "Something went wrong"
                        });
                    }
                  }
                  res.status(404).json({
                    message: "You are not following this user!"
                  });
                }
              }
            } else
              res.status(404).json({message: "The user is not found"});
          } else
            res.status(404).json({message: "The session user is not found"});
        } else
          res.status(401).json({message: "Your token seems to have expired"});
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    } else
      res.status(401).json({message: "You are not authorized!"});
  }
};
module.exports = controller;

