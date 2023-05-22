require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
console.log(process.env.HARPERDB_URL); // Imprime la URL de HarperDB desde las variables de entorno

const express = require('express'); // Importa el módulo Express
const app = express(); // Crea una instancia de la aplicación Express
const http = require('http'); // Importa el módulo HTTP de Node.js
const cors = require('cors'); // Importa el módulo CORS

const { Server } = require('socket.io'); // Importa la clase Server de Socket.IO
const harperSaveMessage = require('./services/harper-save-message'); // Importa la función para guardar mensajes en HarperDB
const harperGetMessages = require('./services/harper-get-messages'); // Importa la función para obtener mensajes de HarperDB
const leaveRoom = require('./utils/leave-room'); // Importa la función para eliminar a un usuario de una sala de chat

app.use(cors()); // Habilita CORS en la aplicación Express

const server = http.createServer(app); // Crea el servidor HTTP utilizando la aplicación Express

const io = new Server(server, {
  cors: {
    origin: "https://lechat.netlify.app", // Define el origen permitido para las solicitudes CORS
    methods: ['GET', 'POST'], // Define los métodos permitidos para las solicitudes CORS
  },
});

const CHAT_BOT = 'ChatBot'; // Define el nombre del chatbot

let chatRoom = ''; // Almacena el nombre de la sala de chat actual
let allUsers = []; // Almacena la información de todos los usuarios conectados

io.on('connection', (socket) => { // Maneja el evento de conexión de Socket.IO cuando un cliente se conecta al servidor
  console.log(`User connected ${socket.id}`);

  socket.on('join_room', (data) => { // Maneja el evento 'join_room' cuando un cliente se une a una sala de chat
    const { username, room } = data;
    socket.join(room); // El cliente se une a la sala de chat específica

    let __createdtime__ = Date.now();
    socket.to(room).emit('receive_message', {
      message: `${username} has joined the chat room`, // Mensaje enviado cuando un usuario se une a la sala de chat
      username: CHAT_BOT, // Nombre de usuario del chatbot
      __createdtime__, // Tiempo de creación del mensaje
    });
    socket.emit('receive_message', {
      message: `Welcome ${username}`, // Mensaje de bienvenida enviado al usuario recién unido
      username: CHAT_BOT, // Nombre de usuario del chatbot
      __createdtime__, // Tiempo de creación del mensaje
    });

    chatRoom = room; // Establece la sala de chat actual
    allUsers.push({ id: socket.id, username, room }); // Agrega al usuario a la lista de todos los usuarios conectados

    chatRoomUsers = allUsers.filter((user) => user.room === room); // Filtra los usuarios en la sala de chat actual
    socket.to(room).emit('chatroom_users', chatRoomUsers); // Envía la lista de usuarios a los clientes en la sala de chat
    socket.emit('chatroom_users', chatRoomUsers);

    harperGetMessages(room)
      .then((last100Messages) => {
        socket.emit('last_100_messages', last100Messages); // Envía los últimos 100 mensajes a los clientes en la sala de chat
    })
    .catch((err) => console.log(err));
});

socket.on('leave_room', (data) => { // Maneja el evento 'leave_room' cuando un cliente abandona una sala de chat
  const { username, room } = data;
  socket.leave(room); // El cliente abandona la sala de chat

  const __createdtime__ = Date.now();

  allUsers = leaveRoom(socket.id, allUsers); // Elimina al usuario de la lista de todos los usuarios conectados
  socket.to(room).emit('chatroom_users', allUsers); // Envía la lista actualizada de usuarios a los clientes en la sala de chat
  socket.to(room).emit('receive_message', {
    username: CHAT_BOT,
    message: `${username} has left the chat`, // Mensaje enviado cuando un usuario abandona la sala de chat
    __createdtime__,
  });
  console.log(`${username} has left the chat`);
});

socket.on('send_message', (data) => { // Maneja el evento 'send_message' cuando un cliente envía un mensaje
  const { message, username, room, __createdtime__ } = data;
  io.in(room).emit('receive_message', data); // Envía el mensaje a todos los clientes en la sala de chat

  harperSaveMessage(message, username, room, __createdtime__) // Guarda el mensaje en HarperDB
    .then((response) => console.log(response))
    .catch((err) => console.log(err));
});

socket.on('disconnect', () => { // Maneja el evento de desconexión de Socket.IO cuando un cliente se desconecta del servidor
  console.log('User disconnected from the chat');
  const user = allUsers.find((user) => user.id == socket.id);
  if (user?.username) {
    allUsers = leaveRoom(socket.id, allUsers);
    socket.to(chatRoom).emit('chatroom_users', allUsers); // Envía la lista actualizada de usuarios a los clientes en la sala de chat
    socket.to(chatRoom).emit('receive_message', {
      message: `${user.username} has disconnected from the chat.`,
    });
  }
});
});

app.get('/', (req, res) => { // Ruta de acceso a la página principal
res.send('Hello world');
});

server.listen(4000, () => 'Server is running on port 4000'); // Inicia el servidor en el puerto 4000
