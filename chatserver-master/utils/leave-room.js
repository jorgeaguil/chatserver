// La función leaveRoom recibe el ID de usuario y la lista de usuarios en la sala de chat
function leaveRoom(userID, chatRoomUsers) {
  // Se utiliza el método filter para crear una nueva lista de usuarios filtrando aquellos cuyo ID no coincide con el ID de usuario proporcionado
  return chatRoomUsers.filter((user) => user.id != userID);
}

// Se exporta la función leaveRoom para que pueda ser utilizada en otros módulos
module.exports = leaveRoom;
