var _ = require("lodash");
let bcrypt = require("bcrypt");

const Joi = require("joi");

const { User } = require("../models/users");

let express = require("express");
let router = express.Router();

router.post("/login", async (req, res) => {


  const { error } = validateLoginParams(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  const { email } = req.body;
try {
  let user = await User.findOne({ email });
  let {email, firstName, lastName, password, verified} = user;
  if (!user) return res.status(400).send("Invalid email or password. ");

  if(!verified) throw new Error('please verfiy your account before trying to log in');
  
  const validPassword = await bcrypt.compare(req.body.password, password);
  if (!validPassword)return res.status(400).send("Invalid email or password. ");

  const authToken = user.generateAuthToken();

  res.header('x-auth-token', authToken).json({
    firstName,
    lastName,
    email
  });

} catch (error) {
  res.json({
    status: "UNVERIFIED USER",
    message: error.message,
  });
}

});

function validateLoginParams(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

module.exports = router;
