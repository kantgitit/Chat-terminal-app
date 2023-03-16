const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new net.Socket();

let username;

client.connect(8000, 'localhost', () => {
  console.log('Connected to server');

  rl.question('Enter your username: ', answer => {
    username = answer.trim();
    client.write(username);
  });
});

client.on('data', data => {
  data = data.toString().trim();
  console.log(data);
  if (data.endsWith('Waiting for response...')) {
    rl.question('Do you accept? (yes/no) ', answer => {
      answer = answer.trim().toLowerCase();
      client.write(answer);
    });
  } else if (data.startsWith('Request sent to')) {
    console.log('Type "/cancel" to cancel the request.');
  } else if (data.startsWith('You are now connected to')) {
    console.log('You are now in a private chat session.');
    rl.prompt();
  } else if (data.endsWith('has left the session.')) {
    console.log('Session ended.');
    rl.prompt();
  } else if (data.startsWith('[')) {
    console.log(data);
    rl.prompt();
  }
});

client.on('close', () => {
  console.log('Connection closed');
});

rl.on('line', input => {
  input = input.trim();
  if (input === '/online') {
    client.write(input);
  } else if (input.startsWith('/connect ')) {
    client.write(input);
  } else if (input === '/cancel') {
    console.log('Request cancelled.');
    rl.prompt();
  } else if (input === '/quit') {
    client.end();
  } else {
    client.write(input);
  }
});
