// -- Imports
// --------------------------------------------------
import fs from "fs";
import { rmSync } from "fs";
import { createServer } from "http";
import express from "express";
import Datastore from "nedb";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import { join } from "path";
import session from "express-session";
import validator from "validator";
import { genSalt, hash, compare } from "bcrypt";
import { serialize } from "cookie";
import cors from 'cors';
import { Chess } from 'chess.js';
import stockfishDriver from './stockfishDriver.js';
import { WebSocket, WebSocketServer } from 'ws';


// // MONGO DB

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://nncchess:KwxWWAtFoCOUDQhj@cluster0.dsffoji.mongodb.net/?retryWrites=true&w=majority";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);


// -- MACROS (TODO: move to .env file)
// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 4000;
const SALTROUNDS = 10;
const SECRET = "M$^9r&kF@p2oJw#YmLk*UaJqXtHwVz";
const USR_DB_PATH = '/users.db';
const IMG_DB_PATH = '/images.db';
const NTF_DB_PATH = '/notifications.db';
const NOTIFS_PER_PAGE = 10;
const upload = multer({ dest: 'uploads/' });

// -- app.use stuff
// --------------------------------------------------
const app = express();
// Enable CORS for all routes
app.use(express.static("static"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
    session({
        secret: SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(function (req, res, next) {
    req.username = req.session.username ?? null;
    console.log("HTTP request", req.username, req.method, req.url, req.body);
    next();
});

// Enable CORS for all routes
app.use(cors({ 
    origin: 'http://34.130.219.58', 
    credentials: true 
  }));

// -- Classes
// --------------------------------------------------
class User {
    constructor({ _id, hash, friends }) {
        this._id = _id;
        this.hash = hash;
        // TODO: Implement using graph datastructure
        this.friends = friends || [];
        this.profilepic;
        this._deleted = false;
    }
}

class Image {
    constructor({ picture }) {
        this._deleted = false;
        this.picture = picture;
    }
}

class Notification {
    constructor({ owner, message }) {
        this._deleted = false;
        this.owner = owner;
        this.type = this.constructor.name;
        this.message = message || '';
    }
}

class AddFriend extends Notification {
    constructor({ owner, from }) {
        super({owner, message: `${from} has sent you a friend request`});
        this.from = from;
    }
}


// -- Global Variables
// --------------------------------------------------
let users = null;
let images = null;
let notifications = null;

// -- Helpers
// --------------------------------------------------
// -- Formatting
function formatTimestamp(timestamp) {
    const createdDate = new Date(timestamp);

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        // hour: '2-digit',
        // minute: '2-digit',
        // second: '2-digit',
    }).format(createdDate);
}

// -- Database
function getItems(dbObj, callback) {
    return dbObj
        .find({})
        .sort({ createdAt: -1 })
        .exec(function (err, items) {
            if (err) return callback(err, null);
            return callback(err, items.reverse());
        });

}

export function getUsers(callback) {
    return getItems(users, callback);
}

export function getImages(callback) {
    return getItems(images, callback);
}

export function getNotifications(callback) {
    return getItems(notifications, callback);
}

export function initializeDatabases(prefix = 'db') {
    users = new Datastore({ filename: join(prefix, USR_DB_PATH), autoload: true, timestampData: true }); 
    images = new Datastore({ filename: join(prefix, IMG_DB_PATH), autoload: true, timestampData: true });
    notifications = new Datastore({ filename: join(prefix, NTF_DB_PATH), autoload: true, timestampData: true });  
}

export function deleteDatabases(prefix = 'db') {
    rmSync(prefix, { recursive: true, force: true });
}


// -- Validation/Formatting
// -------------------
function validateInput(validations, callback) {
    for (const validation of validations) {
        if (!validation()) {
            callback(validation);
            break;
        }
    }
}

function isAuthenticated(req, res, next) {
    if (!req.username) return res.status(401).json({ error: "access denied" });
    next();
};

function CheckUsernamePasswordFormat(req, res, next) {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.body.username,
        () => validator.isAlphanumeric(req.body.username),
        () => req.body.password,
        () => validator.isAlphanumeric(req.body.password)
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

    if (res.headersSent) return;
    next();
}


// -- API Endpoints
// --------------------------------------------------
// -- User Management
// -------------------
// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post("/signup/", CheckUsernamePasswordFormat, function (req, res, next) {
    // check if user already exists in the database
    users.findOne({ _id: req.body.username }, function (err, user) {
        if (err) return res.status(500).json({ error: err });
        if (user) return res.status(409).json({ error: "username " + req.body.username + " already exists" });
        // generate a new salt and hash
        genSalt(SALTROUNDS, function(err, salt) {
            hash(req.body.password, salt, function(err, hash) {
                // insert new user into the database
                const user = new User({_id: req.body.username, hash: hash});
                users.update({_id: req.body.username}, user, {upsert: true}, function(err){
                    if (err) return res.status(500).json({ error: err });
                    // start a session
                    req.session.username = req.body.username;
                    // initialize cookie
                    res.setHeader("Set-Cookie", serialize("username", req.body.username, {
                        path: "/",
                        maxAge: 60 * 60 * 24 * 7,
                    }));
                    return res.status(200).json(req.body.username);
                });
            });
        });
    });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post("/signin/", CheckUsernamePasswordFormat, function (req, res, next) {
    // retrieve user from the database
    users.findOne({ _id: req.body.username }, function (err, user) {
        if (err) return res.status(500).json({ error: err });
        if (!user) return res.status(401).json({ error: "access denied" });
        compare(req.body.password, user.hash, function(err, valid) {
            if (err) return res.status(500).json({ error: err });
            if (!valid) return res.status(401).json({ error: "access denied" });
            // start a session
            req.session.username = req.body.username;
            // initialize cookie
            res.setHeader('Set-Cookie', serialize('username', req.body.username, {
                path : '/', 
                maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
            }));
            return res.status(200).json(req.body.username);
         });
    });
});

// curl -b cookie.txt -c cookie.txt http://localhost:3000/signout/
app.get('/signout/', function(req, res, next){
    req.session.destroy();
    // destroy cookie
    res.setHeader('Set-Cookie', serialize('username', '', {
          path : '/', 
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    return res.status(200).json({ data: `User has signed out successfully.` });
});

app.get('/sessionActive/', function(req, res, next){
    console.log(!!req.username ? `User ${req.username} is logged in.` : `User is logged out.`);
    return res.status(200).json(!!req.username);
});

app.get("/api/search/:query", isAuthenticated, (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.params.query,
        () => validator.isAlphanumeric(req.params.query)
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

    if (!res.headersSent) {
        // Using $regex to find all users with ids where query is a substring
        users.find({ _id: { $regex: RegExp(req.params.query, "i") } }, {hash: 0}, (err, users) => {
            if (err) {
                return res.status(500)
                    .json({ error: `Error executing search query: ${req.params.query}. Error: ${err}` });
            }
            if (!users) return res.status(404).json([]);
            const changeFriendListToBoolean = users.map(user => {
                user.friends = user._id === req.username
                || user.friends.includes(req.username);
                return user;
            });
            console.log(changeFriendListToBoolean);
            return res.status(200).json(changeFriendListToBoolean);
        });
    }
});

// -- User Information
// -------------------
app.get("/api/user/:id", isAuthenticated, (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.params.id,
        () => validator.isAlphanumeric(req.params.id)
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

    if (!res.headersSent) {
        users.findOne({_id: req.params.id}, {hash: 0}).exec((err, user) => {
            if (err) {
                return res.status(500)
                    .json({ error: `Error checking if user with id: ${req.params.id} exists` });
            }
            if (!user) {
                return res.status(404).json({ error: `User with id: ${req.params.id} does not exist.` });
            }
            user.createdAt = formatTimestamp(user.createdAt);
            return res.status(200).json(user);
        });
    }
});

app.post("/api/add/friend/:id", isAuthenticated, (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.params.id,
        () => validator.isAlphanumeric(req.params.id)
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

    if (!res.headersSent) {
        if (req.username === req.params.id) {
            return res.status(403).json({ error: `Not allowed to add yourself as a friend.`});
        }
        notifications.findOne({_deleted: false, type: "AddFriend", from: req.params.id, owner: req.username}).exec((err, friendreq) => {
            if (friendreq) {
                users.findOne({_id: req.params.id}).exec((err, otherUser) => {
                    if (err) {
                        return res.status(500)
                            .json({ error: `Error checking if user with id: ${req.params.id} exists` });
                    }
                    if (!otherUser) {
                        return res.status(404).json({ error: `User with id: ${req.params.id} does not exist.` });
                    }
                    if (otherUser.friends.includes(req.username)) {
                        return res.status(409).json({error: `User ${otherUser._id} is already your friend.`});
                    }
                    users.findOne({_id: req.username}).exec((err, userLoggedIn) => {
                        if (err) {
                            return res.status(500)
                                .json({ error: `Error checking if user with id: ${req.username} exists` });
                        }
                        if (!userLoggedIn) {
                            return res.status(404).json({ error: `User with id: ${req.username} does not exist.` });
                        }
                        
                        users.update({_id: userLoggedIn._id}, { $set: {friends: [...userLoggedIn.friends, otherUser._id]} }, function(err) {
                            if (err) return res.status(500).json({ error: err });
                            users.update({_id: otherUser._id}, { $set: {friends: [...otherUser.friends, userLoggedIn._id]} }, function(err) {
                                if (err) return res.status(500).json({ error: err });
                                const addFriendNotif = new AddFriend({owner: req.username, from: req.params.id});
                                notifications.remove(addFriendNotif, (err, removed) => {
                                    return res.status(200).json([...userLoggedIn.friends, otherUser._id]);
                                });
                            });
                        });
                    });
                });
            } else {
                users.findOne({_id: req.username}).exec((err, user) => {
                    if (err) return res.status(500).json({error: err});
                    if (!user) return res.status(500).json({error: "Expected to find req sender's username but was unable to."});
                    if (!user.friends) return res.status(500).json({error: `Invalid data in db for sender's user (${req.username})`});
                    if (user.friends.includes(req.params.id)) return res.status(409).json({error: `User ${req.params.id} is already your friend.`});
                    const addFriendNotif = new AddFriend({owner: req.params.id, from: req.username});
                    notifications.update(addFriendNotif, addFriendNotif, {upsert: true}, function(err){
                        if (err) return res.status(500).json({ error: err });
                        return res.status(201).json(`Friend request sent to ${req.params.id}.`);
                    });
                });
            }
        });
    }
});

//curl -b cookie.txt -i -F "title=title" -F "picture=@/test/images/1.jpg" http://localhost:3000/api/images/
app.post("/api/user/image/", isAuthenticated, upload.single("picture"), (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.body,
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

    // TODO: Set a size limit on a picture
    // TODO: Delete existing image
    if (!res.headersSent) {
        users.findOne({_id: req.username}).exec((err, user) => {
            if (err) return res.status(500).json({ error: `Error checking if user with id: ${req.username} exists` });
            if (!user) return res.status(404).json({ error: `User with id: ${req.username} does not exist.` });

            images.findOne({ _deleted: false, _id: user.profilepic }).exec((err, oldPic) => {
                if (err) return res.status(500).json({ error: `There was a problem finding the profile picture for user: ${user._id}.` });

                // Use object destructuring for conciseness
                const { file: picture } = req;
                const image = new Image({ picture });
                images.insert(image, (err, newPic) => {
                    if (err) return res.status(500).json({ error: `There was a problem inserting a new profile picture for user: ${user._id}.`});

                    users.update({_id: req.username}, { $set: {profilepic: newPic._id} }, function(err) {
                        if (err) return res.status(500).json({ error: `There was a problem updating the profile picture entry for user: ${user._id}` });

                        images.remove({ _id: (oldPic? oldPic._id : null)}, { multi: false }, (err) => {
                            if (err) {
                                return res.status(500).json({ error: `There was a problem removing the existing profile picture for user: ${user._id}.` });
                            }
                            const exitFunc = () => {
                                // Construct the URL to the newly created resource
                                const newResourceURL = `/api/profile/${req.username}/image/`;
                                return res.location(newResourceURL).status(201).json(newPic);
                            }
                            if (oldPic) {
                                // Delete the corresponding file from the /uploads directory
                                const imagePath = `uploads/${oldPic.picture.filename}`;
                                fs.unlink(imagePath, (err) => {
                                    if (err) {
                                        return res.status(500).json({ error: `There was a problem deleting the image file with id ${oldPic._id}` });
                                    }
                                    return exitFunc();
                                });
                            } else {
                                return exitFunc();
                            }
                            
                        });
                    });
                });
            });
        });
    }
});

app.get("/api/user/:id/image", isAuthenticated, (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.params.id,
        () => validator.isAlphanumeric(req.params.id)
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));


    if (!res.headersSent) {
        users.findOne({_id: req.params.id}, {hash: 0}).exec((err, user) => {
            if (err) {
                return res.status(500)
                    .json({ error: `Error checking if user with id: ${req.params.id} exists` });
            }
            if (!user) {
                return res.status(404).json({ error: `User with id: ${req.params.id} does not exist.` });
            }
            if (!user.profilepic) {
                const absolutePath = path.resolve(__dirname, './static/noProfilePic');
                res.setHeader('Content-Type', "image/jpeg");
                return res.status(404).sendFile(absolutePath);
            }
            images.findOne({ _deleted: false, _id: user.profilepic}).exec((err, image) => {
                if (err) {
                    return res.status(500).json({ error: `There was a problem finding the image with id: ${user.profilepic}` });
                }
                if (!image) return res.status(500).json({ error: `There is no profile picture for user: ${user._id} despite one being expected to be available.` });
    
                const absolutePath = path.resolve(__dirname, image.picture.path);
                res.setHeader('Content-Type', image.picture.mimetype);
                return res.sendFile(absolutePath);
            });
        });
    }
});

app.delete("/api/user/image/", isAuthenticated, (req, res, next) => {
    if (!res.headersSent) {
        users.findOne({_id: req.username}).exec((err, user) => {
            if (err) return res.status(500).json({ error: `Error checking if user with id: ${req.username} exists` });
            if (!user) return res.status(404).json({ error: `User with id: ${req.username} does not exist.` });

            images.findOne({ _deleted: false, _id: user.profilepic }).exec((err, pic) => {
                if (err) return res.status(500).json({ error: `There was a problem finding the profile picture for user: ${user._id}.` });
                if (!pic) return res.status(404).json({ error: `There is no profile picture for user: ${user._id}.` });
                users.update({_id: req.username}, { $set: {profilepic: null} }, function(err) {
                    if (err) return res.status(500).json({ error: `There was a problem updating the profile picture entry for user: ${user._id}` });

                    images.remove({ _id: pic._id }, { multi: false }, (err) => {
                        if (err) {
                            return res.status(500).json({ error: `There was a problem removing the existing profile picture for user: ${user._id}.` });
                        }
                        // Delete the corresponding file from the /uploads directory
                        const imagePath = `uploads/${pic.picture.filename}`;
                        fs.unlink(imagePath, (err) => {
                            if (err) {
                                return res.status(500).json({ error: `There was a problem deleting the image file with id ${pic._id}` });
                            }
                            res.status(200).json("Success");
                        });
                    });
                });

            });
        });
    }
});

app.delete("/api/notification/:id/", isAuthenticated, (req, res, next) => {
    const badRequestValidations = [
        () => req.params.id,
        () => validator.isAlphanumeric(req.params.id)
    ];
    validateInput(badRequestValidations, (validation) =>
        res.status(400).json(
            { error: `Bad Request, validation failed: ${validation}` }
        ));

    if (!res.headersSent) {
        notifications.remove({ owner: req.username, _id: req.params.id }, (err, removed) => {
            if (removed) return res.status(204).send();
            return res.status(404).json({error: `Notification ${req.params.id} not found.`})
        });
    }
});

app.get("/api/notifications/page/:page", isAuthenticated, (req, res, next) => {
    const badRequestValidations = [
        () => req.params.page,
        () => validator.isInt(req.params.page, { gt: 0 })
    ];
    validateInput(badRequestValidations, (validation) =>
        res.status(400).json(
            { error: `Bad Request, validation failed: ${validation}`}
        ));

    if (!res.headersSent) {
        const skip = (req.params.page - 1) * NOTIFS_PER_PAGE;  
        notifications.find({ _deleted: false, owner: req.username })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(NOTIFS_PER_PAGE)
        .exec((err, notifs) => {
            if (err) {
                return res.status(500).json({ error: `Problem finding or processing notifications for user ${req.username}.`});
            } else if (!notifs || notifs.length === 0) {
                // Send a 200 OK response with an empty body
                return res.status(200).json([]);
            } else {
                // Map messages to format the timestamps
                const formattedNotifs = notifs.map(notif => ({
                    ...notif,
                    createdAt: formatTimestamp(notif.createdAt),
                }));
                return res.status(200).json(formattedNotifs);
            }
        });
    }
});


// -- Game Information
// -------------------
app.get("/api/game/analysis/", isAuthenticated, async (req, res, next) => {
    // Perform exhaustive input validation
    const badRequestValidations = [
        () => req.body,
        () => req.body.pgn
    ];
    validateInput(badRequestValidations,
        (validation) => res.status(400).json({ error: `Bad Request, validation failed: ${validation}`}));

        // Initialize Stockfish Driver
        const driver = await stockfishDriver();

        // Initialize chess
        const chess = new Chess();
        chess.loadPgn(req.body.pgn);
        const history = chess.history({verbose: true});

        function evaluate(index = 0, finalResult = []) {
            if (index === history.length) return res.json(finalResult);
            driver.write('isready', (d1) => {
                driver.write(`position fen ${history[index].after}`, () => {
                    driver.write(`go depth 15`, (d2) => {
                        driver.write(`eval`, (d3) => {
                            finalResult.push({eval: d3, bestmove: d2});
                            evaluate(++index, finalResult);
                        });
                    });
                });
            });
        }   
        evaluate();
});


// -- API Error Handling
// -------------------
app.all("/*", (req, res, next) => {
    res.status(404).json({ error: "Not Found." });
});


// -- Start server
// --------------------------------------------------
initializeDatabases();

export const server = createServer(app).listen(PORT, (err) => {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});

// Set up a WebSocket server
const wss = new WebSocketServer({ server });

let playerCount = 0;

wss.on('connection', (ws) => {
  playerCount++;
  const role = playerCount === 1 ? 'white' : 'black';
  console.log(`Player count: ${playerCount}, Assigned role: ${role}`);
  ws.send(JSON.stringify({ type: 'roleAssignment', role: role }));

  ws.on('message', (message) => {
    console.log("Received message:", message);
    // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Player disconnected');
    playerCount--;
    if (playerCount < 0) playerCount = 0; // Ensure playerCount doesn't go negative
  });
});
