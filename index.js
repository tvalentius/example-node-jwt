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

// route : register a user
apiRoutes.post('/register', (req, res) => {
  if(req.body.email === '' || !req.body.email) {
    res.json({
      success: false,
      message: `Registration failed. 'email' not found.`
    });
    return
  }

  if(req.body.name === '' || !req.body.name) {
    res.json({
      success: false,
      message: `Registration failed. 'name' not found.`
    });
    return
  }

  if(req.body.password === '' || !req.body.password) {
    res.json({
      success: false,
      message: `Registration failed. 'password' not found.`
    });
    return
  }

  //check if user existed
  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) throw err;

    if(user) {
      res.json({
        success: false,
        message: 'Registration failed. Email already existed.'
      });
      return;
    }

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      admin: 'false'
    });

    newUser.password = newUser.generateHash(req.body.password);

    newUser.save((err) => {
      if(err) throw err;

      console.log('User registration success!');
      res.json({
        success: true,
        message: 'Registration success. User registered.'
      });
    })

  });

})

// route : authenticate a user (POST : /api/authenticate)
apiRoutes.post('/authenticate', (req, res) => {
  User.findOne({
    email: req.body.email
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
        });
      }
    }
  })
});

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

// register /api routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send(`API is at HTTP://${HOST}:${PORT}/api`);
});

app.get('/setup', (req, res) => {
  const adminUser = new User({
    name: 'admin',
    email: 'admin@waynecorp.com',
    admin: 'true'
  });

  adminUser.password = adminUser.generateHash('admin123');

  adminUser.save((err) => {
    if(err) throw err;

    console.log('User saved succesfully');
    res.json({ success: true });
  })
})

app.listen(PORT);
