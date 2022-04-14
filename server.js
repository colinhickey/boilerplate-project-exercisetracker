const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const uri = process.env.mongo_uri;
const bodyParser = require("body-parser");
const querystring = require("querystring");
const url = require("url");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const urlencodedParser = bodyParser.urlencoded({ extended: true });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

mongoose.connect(uri);

//USER SCHEMA
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

//USER MODEL
const User = mongoose.model("User", UserSchema);

//EXERCISE SCHEMA
const ExerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

//EXERCISE MODEL
const Exercise = mongoose.model("Exercise", ExerciseSchema);

//ADD A NEW USER
app.post("/api/users", urlencodedParser, function (req, res) {
  const newUser = new User({ username: req.body.username });
  newUser.save().then(function (doc) {
    res.json({ _id: doc._id, username: doc.username });
  });
});

//GET ALL USERS
app.get("/api/users", function (req, res) {
  let allUsers = User.find(function (err, arr) {
    res.json(arr);
  });
});

//ADD A NEW EXERCISE FOR A USER

app.post("/api/users/:_id/exercises", urlencodedParser, function (req, res) {
  const date = Date.parse(req.body.date);
  if (isNaN(date) == true) {
    var exerciseDateRaw = new Date(Date.now());
    
    var exerciseDate = exerciseDateRaw.toDateString();
    
  } else {
    exerciseDateRaw = new Date(req.body.date);
    exerciseDate = exerciseDateRaw.toDateString();
  }

  User.findById(req.params._id, function (err, foundUser) {
    
    let newExercise = new Exercise({
      username: foundUser.username,
      description: req.body.description,
      duration: req.body.duration,
      date: exerciseDate,
    });
    newExercise.save().then(function (doc) {
      
      res.json({
        _id: req.params._id,
        username: doc.username,
        date: doc.date,
        duration: doc.duration,
        description: doc.description,
      });
    });
  });
});

//GET REQEUST FOR ALL EXERCISE LOGS
app.get("/api/users/:_id/logs", function (req, res) {
  const reqUrl = url.parse(req.url, true);

  User.findById(req.params._id, function (err, doc) {
    Exercise.find({ username: doc.username }, function (err, arr) {
      //set variables depending on URL parameters or not
      
      //FROM
      let fromDate = "";
      if (
        req.query.from == undefined ||
        req.query.from == "" ||
        req.query.from == null
      ) {
        
        fromDate = 0;
      } else {
        
        fromDate = Date.parse(req.query.from);
      }
      

      //TO

      let toDate = "";
      if (
        req.query.to == undefined ||
        req.query.to == "" ||
        req.query.to == null
      ) {
        
        toDate = Date.now();
      } else {
        
        toDate = Date.parse(req.query.to);
      }
      

      //LIMIT
      let limit;
      if (
        req.query.limit == undefined ||
        req.query.limit == "" ||
        req.query.limit == null
      ) {
        
        limit = arr.length;
      } else {
        
        limit = req.query.limit;
      }
      

      //CLEAN ARRAY

      let filteredArr = [];
      let limitedArr = [];
      
      for (let i= 0; i < arr.length ; i++) {
        if (
          Date.parse(arr[i].date) > fromDate &&
          Date.parse(arr[i].date) < toDate
        ) {
          filteredArr.push(arr[i]);
        }
      }
      
      for (let j = 0; j<limit; j++){
        limitedArr.push(filteredArr[j])
      }
      res.json({
        username: doc.username,
        count: filteredArr.length,
        _id: doc._id,
        log: limitedArr
      });
    });
  });
});
