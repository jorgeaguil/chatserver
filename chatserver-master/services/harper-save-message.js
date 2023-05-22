var axios = require('axios');

function harperSaveMessage(message, username, room) {
  const dbUrl = process.env.HARPERDB_URL; // Obtiene la URL de HarperDB desde las variables de entorno
  const dbPw = process.env.HARPERDB_PW; // Obtiene la contraseña de HarperDB desde las variables de entorno
  if (!dbUrl || !dbPw) return null; // Si la URL o la contraseña de HarperDB no están definidas, devuelve null

  var data = JSON.stringify({
    operation: 'insert',
    schema: 'realtime_chat_app',
    table: 'messages',
    records: [
      {
        message,
        username,
        room,
      },
    ],
  });

  var config = {
    method: 'post',
    url: dbUrl, // URL de HarperDB a la que se enviará la solicitud
    headers: {
      'Content-Type': 'application/json',
      Authorization: dbPw, // Contraseña de autorización para acceder a HarperDB
    },
    data: data, // Datos de la solicitud en formato JSON
  };

  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        resolve(JSON.stringify(response.data)); // Resuelve la promesa con los datos de respuesta convertidos a formato JSON
      })
      .catch(function (error) {
        reject(error); // Rechaza la promesa con el error recibido
      });
  });
}

module.exports = harperSaveMessage; // Exporta la función harperSaveMessage para que esté disponible en otros módulos
