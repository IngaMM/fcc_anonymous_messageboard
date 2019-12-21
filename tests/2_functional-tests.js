/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
var mongoose = require("mongoose");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Every field filled in", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            text: "Text",
            delete_password: "foobar"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });

      test("Missing fields", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            delete_password: "foobar"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "missing input");
            done();
          });
      });
    });

    suite("GET", function() {
      for (let i = 0; i < 12; i++) {
        before(function(done) {
          chai
            .request(server)
            .post("/api/threads/test")
            .send({
              text: "Text " + i,
              delete_password: "foobar"
            })
            .end(function(err, res) {
              done();
            });
        });
      }

      test("Get request", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.notProperty(res.body[0], "delete_password");
            assert.notProperty(res.body[0], "reported");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "replies");
            assert.equal(res.body.length, 10);
            done();
          });
      });
    });

    suite("DELETE", function() {
      let id1;
      let id2;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id1 = res.body[0]._id;
            id2 = res.body[1]._id;
            done();
          });
      });

      test("Delete request with non-existing id", function(done) {
        let id = new mongoose.mongo.ObjectId();
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: id, delete_password: "foobar" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(
              res.text,
              "Thread with id " + id + " on board test does not exist!"
            );
            done();
          });
      });

      test("Delete request with wrong password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: id1, delete_password: "foobart" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Delete request with correct password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: id2, delete_password: "foobar" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      let id3;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id3 = res.body[2]._id;
            done();
          });
      });

      test("Put request with non-existing id", function(done) {
        let id = new mongoose.mongo.ObjectId();
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: id })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(
              res.text,
              "Thread with id " + id + " on board test does not exist!"
            );
            done();
          });
      });

      test("Put request", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: id3 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      let id4;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id4 = res.body[3]._id;
            done();
          });
      });

      test("Every field filled in", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "Text",
            delete_password: "foobar",
            thread_id: id4
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });

      test("Missing fields", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            delete_password: "foobar",
            thread_id: id4
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "missing input");
            done();
          });
      });
    });

    suite("GET", function() {
      let id5;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id5 = res.body[4]._id;
            done();
          });
      });

      test("Get request", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: id5 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "text");
            assert.notProperty(res.body, "delete_password");
            assert.notProperty(res.body, "reported");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "replies");
            done();
          });
      });
    });

    suite("DELETE", function() {
      let id_thread;
      let id_reply1;
      let id_reply2;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id_thread = res.body[5]._id;
            done();
          });
      });

      before(function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "Reply1",
            delete_password: "foobar",
            thread_id: id_thread
          })
          .end(function(err, res) {
            done();
          });
      });

      before(function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "Reply2",
            delete_password: "foobar",
            thread_id: id_thread
          })
          .end(function(err, res) {
            done();
          });
      });

      before(function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: id_thread })
          .end(function(err, res) {
            id_reply1 = res.body.replies[0]._id;
            id_reply2 = res.body.replies[1]._id;
            done();
          });
      });

      test("Delete request with non-existing id", function(done) {
        let id = new mongoose.mongo.ObjectId();
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: id_thread,
            reply_id: id,
            delete_password: "foobar"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(
              res.text,
              "Reply with id " + id + " does not exist for thread " + id_thread
            );
            done();
          });
      });

      test("Delete request with wrong password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: id_thread,
            reply_id: id_reply1,
            delete_password: "foobart"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Delete request with correct password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: id_thread,
            reply_id: id_reply2,
            delete_password: "foobar"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      let id_thread;
      let id_reply;

      before(function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .query({})
          .end(function(err, res) {
            id_thread = res.body[6]._id;
            done();
          });
      });

      before(function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "Reply1",
            delete_password: "foobar",
            thread_id: id_thread
          })
          .end(function(err, res) {
            done();
          });
      });

      before(function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: id_thread })
          .end(function(err, res) {
            id_reply = res.body.replies[0]._id;
            done();
          });
      });

      test("Put request with non-existing id", function(done) {
        let id = new mongoose.mongo.ObjectId();
        chai
          .request(server)
          .put("/api/replies/test")
          .send({
            thread_id: id_thread,
            reply_id: id
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(
              res.text,
              "Reply with id " + id + " does not exist for thread " + id_thread
            );
            done();
          });
      });

      test("Put request", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({
            thread_id: id_thread,
            reply_id: id_reply
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});
