var { Constants } = require("./constants");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

// init express server, socket io server, and serve static content from `public`
const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(cors());
app.use(express.static("public"));

const getRndInteger = (min, max) =>
  Math.floor(Math.random() * (max - min)) + min;

var numberOfConnectedUsers = 0;
var coin = { x: getRndInteger(50, Constants.WIDTH), y: getRndInteger(50, Constants.HEIGHT) };
var blue_orb = { x: getRndInteger(50, Constants.WIDTH), y: getRndInteger(50, Constants.HEIGHT) };
var red_orb = { x: getRndInteger(50, Constants.WIDTH), y: getRndInteger(50, Constants.HEIGHT) };

//store user info, maps socket_id -> user object.
var all_users = {};


io.on("connect", (socket) => {
  numberOfConnectedUsers++;
  /*
  Give each new user an ID , coin position, and info on
  the remaining users.
  */
  socket.emit("to_new_user", {
    id: socket.id,
    coin: coin,
    blue_orb: blue_orb,
    red_orb: red_orb,
    others: all_users,
  });

  /*
  When a user updates their info, broadcast their
  new location to the others.
  */
  socket.on("update_coordinates", (params, callback) => {
    const x = params.x;
    const y = params.y;
    const score = params.score;
    const name = params.name;
    const angle = params.angle;
    const bullets = params.bullets;
    all_users[socket.id] = { x, y, score, name, bullets, angle };
    socket.broadcast.emit("to_others", {
      id: socket.id,
      score: score,
      x: x,
      y: y,
      name: name,
      bullets: bullets,
      angle: angle,
    });
  });

  socket.on("shot", (p, c) => socket.broadcast.emit("other_shot"));

  /*
  When a user collects the coin, let the others
  know of its new position.
  */
  socket.on("update_coin", (params, callback) => {
    coin = { x: params.x, y: params.y };
    socket.broadcast.emit("coin_changed", {
      coin,
    });
  });
  socket.on("update_item", (params, callback) => {
    item = { item_name: params.item_name, x: params.x, y: params.y };
    socket.broadcast.emit("item_changed", {
      item,
    });
  });

  socket.on("collision", (params, callback) => {
    socket.broadcast.emit("other_collision", {
      bullet_user_id: params.bullet_user_id,
      bullet_index: params.bullet_index,
      exploded_user_id: socket.id,
    });
  });

  /*
  When a user disconnects, remove them from server memory,
  and broadcast their disconnection to the others.
  */
  socket.on("disconnect", () => {
    numberOfConnectedUsers--;
    socket.broadcast.emit("user_disconnected", {
      id: socket.id,
    });
    delete all_users[socket.id];
  });
});


app.get("/health", (req, res) => res.send(`${process.env.NODE_ENV}`));

// Expose server on 3000
server.listen(process.env.PORT || 3000, () => {
  console.log("Server has started.");
  console.log("gyats are amazing - Ryan");
  console.log("Access game at http://localhost:3000");
  console.log("run by Derek");
  console.log("by: Taiming Wang");
  console.log("run by William & Daniel");
}
);

// Handle the root route
// app.get('/', (req, res) => {
//   res.send('Hello from Vercel!');
// });