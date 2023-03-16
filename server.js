const net = require('net');
const port = 8000;

let clients = [];

const server = net.createServer(socket => {
  console.log('New client connected');

  //socket.write('Welcome to the chat room!\n');
  //socket.write('Enter your username: ');

  let username = '';
  socket.on('data', data => {
    data = data.toString().trim();
    if (!username) {
      username = data;
      clients.push({ username, socket });
      socket.write(`Hi ${username}, you are now connected.\n`);
      broadcast(`${username} has joined the chat.\n`, socket);
    } else {
      if (data === '/online') {
        let onlineUsers = clients.map(client => client.username).join(', ');
        socket.write(`Online users: ${onlineUsers}\n`);
      } else if (data.startsWith('/connect')) {
        let recipientUsername = data.substring(9);
        let recipient = clients.find(client => client.username === recipientUsername);
        if (!recipient) {
          socket.write(`${recipientUsername} is not online.\n`);
        } else if (recipient.socket === socket) {
          socket.write('You cannot connect to yourself.\n');
        } else {
          socket.write(`Request sent to ${recipientUsername}. Waiting for response...\n`);
          recipient.socket.write(`${username} wants to chat with you. Do you accept? (yes/no)\n`);
          recipient.socket.once('data', response => {
            response = response.toString().trim().toLowerCase();
            if (response === 'yes') {
              socket.write(`You are now connected to ${recipientUsername}. All messages will be private between you two.\n`);
              recipient.socket.write(`${username} has accepted your request. You are now connected.\n`);
              socket.removeAllListeners('data');
              recipient.socket.removeAllListeners('data');
              socket.on('data', data => {
                recipient.socket.write(`[${username}]: ${data}`);
              });
              recipient.socket.on('data', data => {
                socket.write(`[${recipientUsername}]: ${data}`);
              });
              socket.once('end', () => {
                recipient.socket.write(`${username} has left the session.\n`);
                recipient.socket.removeAllListeners('data');
              });
              recipient.socket.once('end', () => {
                socket.write(`${recipientUsername} has left the session.\n`);
                socket.removeAllListeners('data');
              });
            } else {
              socket.write(`${recipientUsername} has declined your request.\n`);
            }
          });
        }
      } else {
        broadcast(`[${username}]: ${data}\n`, socket);
      }
    }
  });

  socket.on('end', () => {
    clients = clients.filter(client => client.socket !== socket);
    broadcast(`${username} has left the chat.\n`, socket);
  });

  socket.on('error', error => {
    console.error(`Socket error: ${error.message}`);
  });
});

server.on('error', error => {
  console.error(`Server error: ${error.message}`);
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

function broadcast(message, sender) {
  clients.forEach(client => {
    if (client.socket !== sender) {
      client.socket.write(message);
    }
  });
}
