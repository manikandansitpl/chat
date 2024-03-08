const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { addUser, getUser, getUsersInRoom, removeUser } = require('./user');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors()); // Enables CORS
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded request bodies

// Creating a new Socket.IO instance and setting its CORS policy
const io = new Server(server, {
  cors: {
    origin: "*", // Allows requests from any origin
    methods: ['GET', 'POST'] // Allows only GET and POST requests
  }
});

let users=[];
// Express route handler
app.get('/api', (req, res) => {
  res.json('text from backend'); // Responds with a simple JSON text
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected with socket ID:', socket.id);
  socket.on('logout',()=>{
    // users=[];
  })
  // Joining a specific room
  socket.on("join_user", ({ room,name }) => {
    room = room.trim();
    name = name.trim();
    console.log(`Joining room: ${room}${name}`);
    const {error ,user } = addUser({id:socket.id,name,room});

    if(error) console.log(error);

    socket.emit('message',{user:"admin",text:`hi ${user?.name} welcome to the room ${user?.room}`});

    socket.broadcast.to(user?.room).emit('message',{user:"admin",text:`${user?.name} has join`})

    socket.join(user?.room);

    io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)})

  });
 

  socket.on('sendMessage',(message)=>{
    const user = getUser(socket.id);
    io.to(user.room).emit('message',{user:user.name,text:message});
    io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
  })

  // Handling socket disconnection
  socket.on('disconnect', () => {
    console.log("Socket disconnected:", socket.id);
    const user = removeUser(socket.id);
    if(user){
      io.to(user.room).emit('message',{user:"admin",text:`${user.name} has left`})
    }
  });
});

// Starting the server
server.listen(3000, () => {
  console.log("routwer",users)
  console.log('Server running on port 3000');
});
