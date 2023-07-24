const config = require('config');
var _ = require('lodash');
let bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Joi = require('joi')

const {User} = require('../models/users');


let express = require("express");
let router = express.Router();



router.post('/login', async (req, res)=>{
  console.log(req.body);

  const {error} = validateLoginParams(req.body);

  if(error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({email: req.body.email});

  if (!user) return res.status(400).send('Invalid email or password. ');

  const validPassword = await bcrypt.compare(req.body.password, user.password);

  if(!validPassword) return res.status(400).send('Invalid email or password. ');

  const token = jwt.sign({_id: user._id}, config.get('jwtPrivateKey'));

  res.send(token);
 
});


function validateLoginParams (req) {
    const schema = Joi.object({
       email: Joi.string().min(5).max(255).required().email(),
       password: Joi.string().min(5).max(255).required()
     })
   
   
     return schema.validate(req);
   }
   

   module.exports = router;