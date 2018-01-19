const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');


const jwt = require('jsonwebtoken');
const config = require('./config');
const User = require('./app/models/user');


const HOST = '0.0.0.0';
const PORT = process.env.PORT || 1337;

mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

// Routes

const apiRoutes = express.Router();

// route : authenticate a user (POST : /api/authenticate)
apiRoutes.post('/authenticate', (req, res) => {
  User.findOne({
    name: req.body.name
  }, (err, user) => {
    if (err) throw err;

    if(!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else {
      console.log('user found',user.name,req.body);
      if(!user.validPassword(req.body.password)) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.'
        });
      } else {
        const payload = {
          admin: user.admin
        };

        const token = jwt.sign(payload, app.get('superSecret'), {
          expiresIn: 1440
        });

        res.json({
          success: true,
          message: `Here's your token!`,
          token
        })
      }
    }
  })
})

// route : middleware to verify token
apiRoutes.use( (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if(token) {
    jwt.verify(token, app.get('superSecret'), (err, decoded) => {
      if(err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        })
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    })
  }
});


// route : show random message (GET : /api)
apiRoutes.get('/', (req, res) => {
  res.json({ message : 'Coba JWT & Bcrypt , token is valid'});
});

// route : return all users (GET : /api/users)
apiRoutes.get('/users', (req, res) => {
  User.find({} , (err, users) => {
    res.json(users);
  })
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send(`API is at HTTP://${HOST}:${PORT}/api`);
})

app.get('/setup', (req, res) => {
  const adminUser = new User({
    name: 'admin',
    admin: 'true'
  });

  adminUser.password = mikha.generateHash('admin123');

  adminUser.save((err) => {
    if(err) throw err;

    console.log('User saved succesfully');
    res.json({ success: true });
  })
})

app.listen(PORT);
