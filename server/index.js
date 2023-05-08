// created a server using express’ HTTP Server
const app = require("express")();
const http = require("http").Server(app);

// initialized a Socket.io using the server instance we created
const io = require("socket.io")(http, {
  cors: {
    //origin: 'http://localhost:8080',
    origin: "*", // allow any origin for testing purposes. This should be changed on production.
  },
});

const path = require("path");
const port = process.env.PORT || 3000;

// create DB instance
const DataBase = require("./database.js");
const db = new DataBase();

// handle production to serve chat frontend so we can interact with it
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./public/")));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "./public/", "index.html"));
  });
}

/*
Socket.IO is a JavaScript real-time chat library
Socket.IO works by adding event listeners to an instance of http.Server
Socket.IO has many flags or methods we can call to perform many functions such as emitting an event, listening to events, etc.
Socket.ON(): takes an event name and a callback as parameters, it listens for an event emitted from the server or vice versa, and the callback is used to retrieve any data associated with the event
Socket.EMIT(): emits/sends an event with or without data to the listening sockets including itself
Socket.Broadcast.Emit(): emits an event to other connected clients without itself included
*/

// created our Socket.io connection and start listening for incoming requests/events
io.on("connection", (socket) => {
  console.log("A user with ID: " + socket.id + " connected");

  socket.on("disconnect", () => {
    console.log("A user with ID: " + socket.id + " disconnected");
  });

  if (io.sockets.sockets) {
    socket.emit("connections", io.sockets.sockets.size);
  } else {
    socket.emit("connections", 0);
  }

  // More Socket listening here:

  //receive the message, save it to DB and resend it back to other connected clients using socket.broadcast.emit() flag
  socket.on("chat-message", async (message) => {
    const data = {
      message: message.message,
      user_id: socket.id,
      name: message.user,
    };
    await db.storeUserMessage(data);
    socket.broadcast.emit("chat-message", message);
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  socket.on("joined", async (name) => {
    let messageData = null;
    const data = {
      name,
      user_id: socket.id,
    };
    const user = await db.addUser(data);
    if (user) {
      messageData = await db.fetchUserMessages(data);
      data.messages = messageData;
    }
    socket.broadcast.emit("joined", data);
  });

  socket.on("leave", (data) => {
    // TODO: delete user data here
    socket.broadcast.emit("leave", data);
  });
});

// creat the server and listen to incoming requests using port 8080 on localhost
http.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
