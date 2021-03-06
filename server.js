const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

const passportConfig = require("./config/passport");

const authRoutes = require("./routes/auth");
const habitsRoutes = require("./routes/habits");
const shopRoutes = require("./routes/shop");
const achievementRoutes = require("./routes/achievements");

const db = require("./config/keys").mongoURI;

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "https://habit-creator.cf",
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());

passportConfig(passport);

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/achievements", achievementRoutes);

mongoose
  .connect(db)
  .then(res => {
    app.listen(port);
    console.log(`App listening on port ${port}`);
  })
  .catch(err => console.log(err));
