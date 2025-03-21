import { readFileSync } from "fs";
import chai from "chai";
import chaiHttp from "chai-http";

import {
    server,
    initializeDatabases,
    deleteDatabases,
    getMessages,
    getUsers,
    getImages} from "../app.mjs";
import path from "path";
import { fileURLToPath } from "url";


const expect = chai.expect;
chai.use(chaiHttp);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyImages (userIndex, numImages, username, agent, callback) {
    agent.get(`/api/galleries/${userIndex}/images/count/`).end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.count).to.equal(numImages);

        // Loop through image indices and perform verifications
        for (let i = 1; i <= numImages; i++) {
          // Verify image data
          agent.get(`/api/galleries/${userIndex}/images/${i}/`).end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.title).to.equal(`Image ${i}`);
            expect(res.body.owner).to.equal(username);
            expect(res.body).to.have.property("createdAt");
            // ChatGPT 3.5 prompt: Make a regex to match the formatTimeStamp function
            expect(res.body.createdAt).to.match(/^[A-Z][a-z]{2} \d{2}, \d{4}, \d{2}:\d{2}:\d{2} [APap][Mm]$/);

            // Verify image picture
            agent.get(`/api/galleries/${userIndex}/images/${i}/picture`).end((err, res) => {
              expect(res).to.have.status(200);
              expect(res).to.have.header("content-type", "image/jpeg");
              expect(res.body).to.be.instanceOf(Buffer);
              if (i === numImages) {
                // Verify invalid index
                agent.get(`/api/galleries/${userIndex}/images/10/picture`).end((err, res) => {
                  expect(res).to.have.status(404);
                  // All verifications done, finish the test
                  callback();
                });
              }
            });
          });
        }
    });
}

describe("Testing Static Files", () => {
    after(function () {
        server.close();
    });

    it("it should get index.html", function (done) {
        chai
            .request(server)
            .get("/")
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.text).to.be.equal(
                    readFileSync("./static/index.html", "utf-8"),
                );
                done();
            });
    });
});

describe("Testing API", () => {
    let agent;

    const testData = [
        "The quick brown Fox jumps over the lazy Dog",
        "A man, a plan, a canal – Panama",
        "Hello world!"
    ];

      // Define the images to be uploaded

  const imagePaths = [
    "./images/1.jpg",
    "./images/2.jpg",
    "./images/3.jpg",
    "./images/4.jpg",
    "./images/5.jpg",
    "./images/6.jpg",
    "./images/7.jpg",
    "./images/8.jpg",
    "./images/9.jpg"
  ];

    // Variable to store image data
    let imagesData= [];

    // Variable to store message data
    let messagesData = [];


    before(function () {
        // using an agent saves cookie from one request to the next
        agent = chai.request.agent(server);
        initializeDatabases('testdb');
    });

    after(function () {
        deleteDatabases('testdb');
        server.close();
    });

    it("it should signup a user", function (done) {
        agent
            .post("/signup/")
            .send({ username: "admin", password: "pass4admin" })
            .end(function (err, res) {
                expect(res).to.have.status(200);
                getUsers(function (err, users) {
                    if (err) return done(err);
                    expect(users).to.have.length(1);
                    expect(users[0]).to.have.property("_id", "admin");
                    done();
                });
            });
    });

    it("it should sign in a user", function (done) {
        agent
            .post("/signin/")
            .send({ username: "admin", password: "pass4admin" })
            .end(function (err, res) {
                    expect(res).to.have.status(200);
                    done();
            });
    });

    it("it should add 9 images", (done) => {
        const addImage = (index) => {
            if (index < imagePaths.length) {
                // Add an image
                agent
                .post("/api/images")
                .attach("picture", path.join(__dirname, imagePaths[index]), path.basename(imagePaths[index]))
                .field("title", `Image ${index + 1}`)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    // Recursively add the next image
                    addImage(index + 1);
                });
            }
            else verifyImages(1, 9, "admin", agent, () => done());

        }; 
        addImage(0);
    });
      
    
      it("it should add 21 messages for each of the 9 images", (done) => {
        const addMessage = (imageIndex, messageIndex) => {
          if (messageIndex <= 21) {

            agent
            .post(`/api/galleries/1/messages/images/${imageIndex}/`)
            .send({ content: `Message ${messageIndex} for Image ${imageIndex}` })
            .end((err, res) => {
              if (err) console.log(err);
              expect(res).to.have.status(201);
              addMessage(imageIndex, messageIndex + 1);
            });
          } else {
            if (imageIndex < imagePaths.length) {
              addMessage(imageIndex + 1, messageIndex);
            } else {
              // All messages added
              done();
            }
          }
        };
        addMessage(1, 1);
      });

    it("it should sign out a user", function (done) {
        agent.get("/signout/").end(function (err, res) {
            expect(res).to.have.status(200);
            done();
        });
    });

    it("it should signup a second user", function (done) {
        agent
            .post("/signup/")
            .send({ username: "admin2", password: "pass4admin" })
            .end(function (err, res) {
                expect(res).to.have.status(200);
                getUsers(function (err, users) {
                    if (err) return done(err);
                    expect(users).to.have.length(2);
                    expect(users[0]).to.have.property("_id", "admin");
                    expect(users[1]).to.have.property("_id", "admin2");
                    done();
                });
            });
    });

    it("it should sign in a second user", function (done) {
        agent
            .post("/signin/")
            .send({ username: "admin2", password: "pass4admin" })
            .end(function (err, res) {
                    expect(res).to.have.status(200);
                    done();
            });
    });

    it("it should add 9 images for second user", (done) => {
        const addImage = (index) => {
            if (index < imagePaths.length) {
                // Add an image
                agent
                .post("/api/images")
                .attach("picture", path.join(__dirname, imagePaths[index]), path.basename(imagePaths[index]))
                .field("title", `Image ${index + 1}`)
                .end((err, res) => {
                    expect(res).to.have.status(201);
                    // Recursively add the next image
                    addImage(index + 1);
                });
            }
            else verifyImages(2, 9, "admin2", agent, () => done());

        }; 
        addImage(0);
    });

    it("it should add 21 messages for each of the 9 images for both users", (done) => {
        const addMessage = (imageIndex, messageIndex, userIndex) => {
            if (messageIndex <= 21) {
                agent
                .post(`/api/galleries/${userIndex}/messages/images/${imageIndex}/`)
                .send({ content: `Message ${messageIndex} for Image ${imageIndex}` })
                .end((err, res) => {
                    if (err) console.log(err);
                    expect(res).to.have.status(201);
                    addMessage(imageIndex, messageIndex + 1, userIndex);
                });
            } else {
                if (imageIndex < imagePaths.length) {
                    addMessage(imageIndex + 1, messageIndex, userIndex);
                } else {
                    // All messages added
                    if (userIndex === 2) done();
                    else addMessage(1, 1, 2);
                }
            }
        };
        addMessage(1, 1, 1);
    });
    

    it("it should not allow second user to delete a message of the first user if it is not the owner of the gallery", (done) => {
        agent
        .get(`/api/galleries/1/messages/5/images/1/`)
        .end((err, res) => {
            const unallowedMessageId = res.body[0]._id;
            expect(res).to.have.status(200);
            agent
            .delete(`/api/messages/${unallowedMessageId}/`)
            .end((err, res) => {
                expect(res).to.have.status(403);
                done();
            });
        });
    });

    it("it should not allow second user to delete an image of the first user", (done) => {
        agent
        .delete(`/api/galleries/1/images/1/`)
        .end((err, res) => {
            expect(res).to.have.status(403);
            done();
        });
    });

    it("it should allow user to delete its own image", (done) => {
        agent
        .delete(`/api/galleries/2/images/9/`)
        .end((err, res) => {
            expect(res).to.have.status(200);
            verifyImages(2, 8, "admin2", agent, () => done())
        });
    });

    it("it should allow user to delete its own message", (done) => {
        agent
        .get(`/api/galleries/2/messages/3/images/1/`)
        .end((err, res) => {
            expect(res).to.have.status(200);
            const allowedMessageId = res.body[0]._id;
            agent
            .delete(`/api/messages/${allowedMessageId}/`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                agent
                .get(`/api/galleries/2/messages/3/images/1/`)
                .end((err, res) => {
                    expect(Object.keys(res.body).length).to.equal(0);
                    done();
                });
            });
        });
    });

    it("it should sign out user2", function (done) {
        agent.get("/signout/").end(function (err, res) {
            expect(res).to.have.status(200);
            done();
        });
    });

    it("it should sign in back to first user", function (done) {
        agent
            .post("/signin/")
            .send({ username: "admin2", password: "pass4admin" })
            .end(function (err, res) {
                    expect(res).to.have.status(200);
                    done();
            });
    });

    it("it should allow first user to delete a message the second user made on first user's gallery", (done) => {
        agent
        .get(`/api/galleries/1/messages/1/images/1/`)
        .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body[0].owner).to.equal("admin2");
            const messageId = res.body[0]._id;
            agent
            .delete(`/api/messages/${messageId}/`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    it("it should sign out first user one last time", function (done) {
        agent.get("/signout/").end(function (err, res) {
            expect(res).to.have.status(200);
            done();
        });
    });

    it("it should unauthorize a signed out user", (done) => {
        agent
        .get(`/api/galleries/1/`)
        .end((err, res) => {
            expect(res).to.have.status(401);
            done();
        });
    });
});
