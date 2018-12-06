const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const authRoutes = require('./routes/auth');

const db = require('./config/keys').mongoURI;

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());

app.use('/api/auth', authRoutes);

mongoose.connect(db)
  .then(res => {
    app.listen(port);

  })
  .catch(err => console.log(err));