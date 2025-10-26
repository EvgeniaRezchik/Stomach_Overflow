const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");
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
  async register(req, res) {
    if (!req.body.fullName || !req.body.login
        || !req.body.email || !req.body.pass || !req.body.repass)
      res.status(400).json({message: "Fill out all the fields!"});
    else {
      const user = new User();
      await user.findOne(req.body.login, "login");
      if (user.login)
        res.status(400).json({message: "This login is already used!"});
      else {
        await user.findOne(req.body.email, "email_address");
        if (user.email_address)
          res.status(400).json({
	    message: "This e-mail address is already used!"
	  });
        else {
	  if (/\W/.test(req.body.login))
	    res.status(400).json({
	      message: 'The login can contain only letters, digits and "_"!'
	    });
	  else if (req.body.login.length > 30)
	    res.status(400).json({
	      message: "The login must contain up to 30 characters!"
	    });
	  else if (req.body.fullName.length > 30)
	    res.status(400).json({
	      message: "The full name must contain up to 30 characters!"
	    });
	  else if (!/\d/.test(req.body.pass) || !/[A-Z]/.test(req.body.pass)
		   || !/[a-z]/.test(req.body.pass))
	    res.status(400).json({
	      message: "The password must contain "
		       + "letters in both upper and lower case and numbers!"
	    });
	  else if (req.body.pass.length < 8)
	    res.status(400).json({
	      message: "The password must contain at least 8 characters!"
	    });
	  else if (req.body.pass !== req.body.repass)
	    res.status(400).json({message: "Password mismatch!"});
	  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email))
	    res.status(400).json({
	      message: "The e-mail address must be valid!"
	    });
	  else if (req.body.email.length > 255)
	    res.status(400).json({
	      message: "The e-mail address must contain up to 255 characters!"
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
	    if (result !== null) {
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
		      @import url('https://fonts.cdnfonts.com/css/nunito');
		      body, .content, .general {align-items: center;
		      display: flex; flex-flow: column nowrap;
		      justify-content: center;}
		      h1, h2, p {font-family: "Nunito", sans-serif;}
		      h1 {background-color: #b3501b;
		      border-start-end-radius: 20px;
		      border-start-start-radius: 20px; color: #fff; margin: 0;
		      padding: 25px 0; text-align: center; width: 100%;}
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
		      <div class="content"> <h2>Your verification code</h2>
		      <p>Here is your one-time code to verify your e-mail
		      address associated with your Stomach Overflow account.
		      It expires in 15 minutes. Don't share this
		      code with anyone!</p> <p class="code">${code}</p> </div>
		      <p class="footer">Stomach Overflow 2025</p> </div>
		      </body> </html>`
	      }, (err, info) => {
	        if (err) {
		  console.log(err.message);
		  res.status(500).json({message: "Something went wrong"});
		} else {
		  const token = jwt.sign({
		    user_id: user.id,
		    user_email: user.email_address,
		    code: code
		  }, "VerificationCodeKey", {
		    expiresIn: "15m"
		  });
		  res.status(201).json({
		    message: "The verification code is sent "
			     + "to your e-mail address!",
		    token: token
		  });
		}
	      });
	    } else
	      res.status(500).json({message: "Something went wrong"});
	  }
	}
      }
    }
  },
  async login(req, res) {
    let authorized = false;
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload)
          authorized = true;
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    }
    if (authorized)
      res.status(400).json({message: "You are already authorized!"});
    else {
      if (!req.body.loginEmail || !req.body.pass)
        res.status(400).json({message: "Fill out all the fields!"});
      else {
        let existing = false;
        const user = new User();
        await user.findOne(req.body.loginEmail, "login");
        if (user.login)
          existing = true;
        else {
          await user.findOne(req.body.loginEmail, "email_address");
          if (user.email_address)
            existing = true;
        }
        if (existing) {
          const salt = "Salt and pepper - to taste";
          const hash = crypto.createHmac("sha512", salt);
          hash.update(req.body.pass);
          const password = hash.digest("hex");
          if (password !== user.password)
            res.status(400).json({message: "Invalid password!"});
          else {
            if (user.email_confirmed) {
              req.user = user;
              const token = jwt.sign({
                id: user.id,
                login: user.login,
                full_name: user.full_name,
                email_address: user.email_address,
                profile_picture: user.profile_picture,
                rating: user.rating,
                role: user.role
              }, "userKey", {
                expiresIn: "30d"
              });
              res.status(200).json({
                message: "You successfully signed in!",
                token: token
              });
            } else
              res.status(403).json({
                message: "Your e-mail address is not confirmed. Please "
                         + "make a request for sending a verification e-mail"
              });
          }
        } else
          res.status(400).json({message: "Invalid login or e-mail address!"});
      }
    }
  },
  async logout(req, res) {
    let authorized = false;
    if (req.headers.authorization) {
      try {
        const payload = jwt.verify(req.headers.authorization.split(" ")[1],
                                   "userKey");
        if (payload)
          authorized = true;
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    }
    if (authorized)
      res.status(200).json({message: "You successfully signed out!"});
    else
      res.status(401).json({message: "You are not authorized!"});
  },
  async passwordReset(req, res) {
    if (!req.body.email)
      res.status(400).json({message: "Fill out the e-mail address field!"});
    else {
      const user = await new User().findOne(req.body.email, "email_address");
      if (!user.email_address)
        res.status(400).json({message: "Invalid e-mail address!"});
      else {
        const token = jwt.sign({
	  user_id: user.id,
	  user_email: user.email_address,
	}, "resetPasswordKey", {
	  expiresIn: "15m"
	});
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
	  subject: "Your password reset link",
	  html: `<!doctype html> <html lang="en"> <head> <style>
	        @import url('https://fonts.cdnfonts.com/css/nunito');
		a, h1, h2, p {font-family: "Nunito", sans-serif;}
		a, h1 {background-color: #b3501b; color: #fff;
		margin: 0; text-align: center;}
		a {border-radius: 20px; font-size: 20px; font-weight: bold;
		margin-bottom: 10px; padding: 10px;
		text-decoration: none; width: 50%;}
		body, .content, .general {align-items: center;
		display: flex; flex-flow: column nowrap;
		justify-content: center;}
		h1 {border-start-end-radius: 20px;
		border-start-start-radius: 20px; padding: 25px 0; width: 100%;}
		.content {border-bottom: 3px solid #ccc;
		border-end-end-radius: 20px; border-end-start-radius: 20px;
		border-left: 3px solid #ccc;
		border-right: 3px solid #ccc; padding: 10px;}
		.footer {color: #555;}
		.general {width: 600px;} </style> </head> <body>
		<div class="general"> <h1>Stomach Overflow</h1>
		<div class="content"> <h2>Reset the password</h2>
		<p>If you see the e-mail, tap the link and change your 
		password. The link expires in 15 minutes. Don't share 
		this mail with anyone!</p>
		<p>
		http://localhost:3000/new-password/${token}
		</p> </div> <p class="footer">Stomach Overflow 2025</p>
		</div> </body> </html>`
	}, (err, info) => {
	  if (err) {
	    console.log(err.message);
	    res.status(500).json({message: "Something went wrong"});
	  } else {
	    res.status(201).json({
	      message: "The reset link is sent to your e-mail address!",
	      token: token
	    });
	  }
	});
      }
    }
  },
  async verification(req, res) {
    if (!req.body.email)
      res.status(400).json({message: "Fill out the e-mail address field!"});
    else {
      const user = await new User().findOne(req.body.email, "email_address");
      if (!user.email_address)
        res.status(400).json({message: "Invalid e-mail address!"});
      else {
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
	        @import url('https://fonts.cdnfonts.com/css/nunito');
		body, .content, .general {align-items: center;
		display: flex; flex-flow: column nowrap;
		justify-content: center;}
		h1, h2, p {font-family: "Nunito", sans-serif;}
		h1 {background-color: #b3501b;
		border-start-end-radius: 20px;
		border-start-start-radius: 20px; color: #fff; margin: 0;
		padding: 25px 0; text-align: center; width: 100%;}
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
		<div class="content"> <h2>Your verification code</h2>
		<p>Here is your one-time code to verify your e-mail
		address associated with your Stomach Overflow account. 
		It expires in 15 minutes. Don't share this 
		code with anyone!</p> <p class="code">${code}</p> </div>
		<p class="footer">Stomach Overflow 2025</p> </div>
		</body> </html>`
	}, (err, info) => {
	  if (err) {
	    console.log(err.message);
	    res.status(500).json({message: "Something went wrong"});
	  } else {
	    const token = jwt.sign({
	      user_id: user.id,
	      user_email: user.email_address,
	      code: code
	    }, "VerificationCodeKey", {
	      expiresIn: "15m"
	    });
	    res.status(200).json({
	      message: "The verification code is sent to your e-mail address!",
	      token: token
	    });
	  }
	});
      }
    }
  },
  async passwordResetToken(req, res) {
    if (!req.body.pass || !req.body.repass)
      res.status(400).json({message: "Fill out all the fields!"});
    else {
      try {
        const payload = jwt.verify(req.params.confirm_token,
		                   "resetPasswordKey");
        if (!payload)
          res.status(400).json({
	    message: "Your reset link seems to have expired"
	  });
        else {
	  const user = await new User().findOne(payload.user_id);
	  if (user.id) {
	    if (!/\d/.test(req.body.pass) || !/[A-Z]/.test(req.body.pass)
	        || !/[a-z]/.test(req.body.pass))
	      res.status(400).json({
	        message: "The password must contain "
		         + "letters in both upper and lower case and numbers!"
	      });
	    else if (req.body.pass.length < 8)
	      res.status(400).json({
	        message: "The password must contain at least 8 characters!"
	      });
	    else if (req.body.pass !== req.body.repass)
	      res.status(400).json({message: "Password mismatch!"});
	    else {
	      const salt = "Salt and pepper - to taste";
	      const hash = crypto.createHmac("sha512", salt);
	      hash.update(req.body.pass);
	      user.password = hash.digest("hex");
	      const result = await user.save();
	      if (result !== null)
	        res.status(200).json({
		  message: "Your password is successfully changed!"
		});
	      else
	        res.status(500).json({message: "Something went wrong"});
	    }
	  } else
	    res.status(404).json({message: "The user is not found"});
	}
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    }
  },
  async verificationToken(req, res) {
    if (!req.body.code)
      res.status(400).json({message: "Enter the verification code!"});
    else {
      try {
        const payload = jwt.verify(req.params.confirm_token,
		                   "VerificationCodeKey");
        if (!payload)
          res.status(400).json({
	    message: "Your verification code seems to have expired"
	  });
        else {
	  if (req.body.code !== payload.code)
	    res.status(400).json({message: "Invalid code!"});
	  else {
	    const user = await new User().findOne(payload.user_id);
	    if (user.id) {
	      user.email_confirmed = true;
	      const result = await user.save();
	      if (result !== null) {
	        req.user = user;
	        const token = jwt.sign({
		  id: user.id,
		  login: user.login,
		  full_name: user.full_name,
		  email_address: user.email_address,
		  profile_picture: user.profile_picture,
		  rating: user.rating,
		  role: user.role
		}, "userKey", {
		  expiresIn: "30d"
		});
	        res.status(200).json({
		  message: "Your e-mail address is successfully verified!",
		  token: token
		});
	      } else
	        res.status(500).json({message: "Something went wrong"});
	    } else
	    res.status(404).json({message: "The user is not found"});
	  }
	}
      } catch(err) {
        res.status(500).json({message: err.message});
      }
    }
  }
};
module.exports = controller;

