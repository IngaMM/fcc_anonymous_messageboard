/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;
var lodash = require("lodash");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const mongoose = require("mongoose");
mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.once("open", function() {
  console.log("Successfully connected");
});

const Schema = mongoose.Schema;

let threadSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  text: { type: String },
  created_on: { type: Date },
  bumped_on: { type: Date },
  reported: { type: Boolean },
  delete_password: { type: String },
  replycount: { type: Number },
  replies: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId },
      text: { type: String },
      created_on: { type: Date },
      delete_password: { type: String },
      reported: { type: Boolean }
    }
  ]
});

function done(err, data) {
  if (err) {
    console.log(err);
  }
  if (data) {
    console.log(data);
  }
  return;
}

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .post(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      if (
        !req.body.text ||
        req.body.text === "" ||
        (!req.body.delete_password || req.body.delete_password === "")
      ) {
        res.send("missing input");
      } else {
        let dateNow = Date.now();
        var thread = new Thread({
          _id: new mongoose.mongo.ObjectId(),
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: dateNow,
          bumped_on: dateNow,
          reported: false,
          replies: [],
          replycount: 0
        });
        thread.save((err, thread) => {
          if (err) {
            return done(err);
          }
          let url = "/b/" + board;
          res.redirect(url);
        });
      }
    })
    .get(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      Thread.find({})
        .sort("-bumped_on")
        .limit(10)
        .select("-reported -delete_password")
        .exec((err, results) => {
          results.forEach(result => {
            result.replies.splice(0, result.replies.length - 3);
            result.replies.sort(
              (a, b) => new Date(b.created_on) - new Date(a.created_on)
            );
          });
          res.send(results);
        });
    })
    .delete(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      Thread.findById(
        new mongoose.mongo.ObjectId(req.body.thread_id),
        (err, thread) => {
          if (err) {
            return done(err);
          }
          if (!thread) {
            res.send(
              "Thread with id " +
                req.body.thread_id +
                " on board " +
                board +
                " does not exist!"
            );
          } else if (thread.delete_password !== req.body.delete_password) {
            res.send("incorrect password");
          } else {
            Thread.findByIdAndRemove(req.body.thread_id, err => {
              if (err) {
                return done(err);
              }
              res.send("success");
            });
          }
        }
      );
    })
    .put(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
     if (mongoose.Types.ObjectId.isValid(req.body.thread_id) === false) {
        res.send("invalid id");
      } else {
        Thread.findById(req.body.thread_id, (err, thread) => {
          if (err) {
            return done(err);
          }
          if (!thread) {
            res.send(
              "Thread with id " +
                req.body.thread_id +
                " on board " +
                board +
                " does not exist!"
            );
          } else {
            let updateForThread = {
              reported: true,
              _id: req.body.thread_id
            };
            Thread.findByIdAndUpdate(
              req.body.thread_id,
              updateForThread,
              { new: true },
              (err, threadWithNewReply) => {
                res.send("success");
              }
            );
          }
        });
      }
    });

  app
    .route("/api/replies/:board")
    .get(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      let thread_id = req.query.thread_id;
      Thread.findById(thread_id)
        .select("-reported -delete_password")
        .exec((err, thread) => {
          if (err) {
            return done(err);
          }
          if (!thread) {
            res.send(
              "Thread with id " +
                req.body.thread_id +
                " on board " +
                board +
                " does not exist!"
            );
          } else {
            thread.replies.sort(
              (a, b) => new Date(b.created_on) - new Date(a.created_on)
            );
            res.send(thread);
          }
        });
    })
    .post(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      if (
        !req.body.text ||
        req.body.text === "" ||
        (!req.body.delete_password ||
          req.body.delete_password === "" ||
          (!req.body.thread_id || req.body.thread_id === ""))
      ) {
        res.send("missing input");
      } else {
        Thread.findById(req.body.thread_id, (err, thread) => {
          if (err) {
            return done(err);
          }
          if (!thread) {
            res.send(
              "Thread with id " +
                req.body.thread_id +
                " on board " +
                board +
                " does not exist!"
            );
          } else {
            let dateNow = Date.now();
            let updatedReplyArray = lodash.cloneDeep(thread.replies);
            updatedReplyArray.push({
              _id: new mongoose.mongo.ObjectId(),
              text: req.body.text,
              delete_password: req.body.delete_password,
              created_on: dateNow,
              reported: false
            });
            let updateForThread = {
              bumped_on: dateNow,
              replies: updatedReplyArray,
              replycount: updatedReplyArray.length,
              _id: req.body.thread_id
            };
            Thread.findByIdAndUpdate(
              req.body.thread_id,
              updateForThread,
              { new: true },
              (err, threadWithNewReply) => {
                let url = "/b/" + board + "/" + req.body.thread_id;
                res.redirect(url);
              }
            );
          }
        });
      }
    })
    .delete(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      Thread.findById(req.body.thread_id, (err, thread) => {
        if (err) {
          return done(err);
        }
        if (!thread) {
          res.send(
            "Thread with id " +
              req.body.thread_id +
              " on board " +
              board +
              " does not exist!"
          );
        } else {
          let index = thread.replies.findIndex(
            reply => reply._id == req.body.reply_id
          );
          if (index === -1) {
            res.send(
              "Reply with id " +
                req.body.reply_id +
                " does not exist for thread " +
                req.body.thread_id
            );
          } else {
            if (
              thread.replies[index].delete_password !== req.body.delete_password
            ) {
              res.send("incorrect password");
            } else {
              let updatedReplyArray = lodash.cloneDeep(thread.replies);
              updatedReplyArray[index].text = "[deleted]";
              let updateForThread = {
                replies: updatedReplyArray,
                _id: req.body.thread_id
              };
              Thread.findByIdAndUpdate(
                req.body.thread_id,
                updateForThread,
                { new: true },
                (err, threadWithDeletedReply) => {
                  res.send("success");
                }
              );
            }
          }
        }
      });
    })
    .put(function(req, res) {
      var board = req.params.board;
      var Thread = mongoose.model("Thread", threadSchema, board);
      if (mongoose.Types.ObjectId.isValid(req.body.thread_id) === false) {
        res.send("invalid id");
      } else {
        Thread.findById(req.body.thread_id, (err, thread) => {
          if (err) {
            return done(err);
          }
          if (!thread) {
            res.send(
              "Thread with id " +
                req.body.thread_id +
                " on board " +
                board +
                " does not exist!"
            );
          } else {
            let index = thread.replies.findIndex(
              reply => reply._id == req.body.reply_id
            );
            if (index === -1) {
              res.send(
                "Reply with id " +
                  req.body.reply_id +
                  " does not exist for thread " +
                  req.body.thread_id
              );
            } else {
              let updatedReplyArray = lodash.cloneDeep(thread.replies);
              updatedReplyArray[index].reported = true;
              let updateForThread = {
                replies: updatedReplyArray,
                _id: req.body.thread_id
              };
              Thread.findByIdAndUpdate(
                req.body.thread_id,
                updateForThread,
                { new: true },
                (err, threadWithReportedReply) => {
                  res.send("success");
                }
              );
            }
          }
        });
      }
    });
};
