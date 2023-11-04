# NamekoClient

**NamekoClient** is a JavaScript client for interacting with Nameko services over RabbitMQ using RPC (Remote Procedure
Call). It provides a convenient way to make RPC calls to Nameko services and handle responses asynchronously.

## Features

- Create a Nameko client to communicate with Nameko services.
- Make RPC calls to services with specified methods.
- Handle responses through Promises or callbacks.
- Configurable connection settings, including RabbitMQ host, vhost, and more.
- Event-based architecture to handle client readiness and errors.

## Installation

You can install **NamekoClient** via npm:

```bash
npm install nameko-client
```

## Usage

Here's an example of how to use the NamekoClient to make an RPC call to a Nameko service:

javascript Copy code

```
const { connect } = require('nameko-client');

// Define connection options const options = { host: 'rabbit', vhost: '/', port: 5672, login: 'guest', password: '
guest', exchange: 'nameko-rpc', timeout: 30000, reconnect: true, };

// Create a client and connect to the Nameko service const onError = (error) => { console.error('Error:', error); };

connect(options, onError)
.then((client) => { // Client is ready to use client.call('serviceName', 'methodName', [arg1, arg2], { kwarg1: value })
.then((result) => { console.log('RPC call result:', result); client.close(); // Close the client when done })
.catch((error) => { console.error('RPC call error:', error); }); })
.catch((error) => { console.error('Client initialization error:', error); });
```

## API Documentation

### `connect(options, onError)`

- `options`: An object containing the connection configuration options.
- `onError`: A callback function to handle connection errors.

Creates a **NamekoClient** instance and establishes a connection to RabbitMQ.

### `NamekoClient.call(service, method, args, kwargs)`

- `service`: The Nameko service name.
- `method`: The method name to call.
- `args`: An array of arguments for the method (can be empty).
- `kwargs`: An object containing keyword arguments (can be empty).

Initiates an RPC call to the specified service and method. Returns a Promise that resolves with the RPC call result or
rejects with an error.

### `NamekoClient.close()`

Closes the connection to RabbitMQ.

## Advanced Usage

If you need to perform more advanced tasks with **NamekoClient**, here are some additional features and methods you can explore:

```
const Rpc = await MainInstance.getRpc()
Rpc.call('auth', 'get_info', [{}, token], {}, function (e, r) {
    if (e || r === null)
        return done(e, false)

    winston.info('User info: %s', r);

    return done(null, r, r);
});
```

### Event Handling

You can register event listeners to handle various events emitted by the **NamekoClient**:

```javascript
const client = new NamekoClient(options, onError);

client.on('ready', () => {
  console.log('Client is ready');
});

client.on('error', (error) => {
  console.error('Client error:', error);
});
```

## Configuration
The options object passed to the connect method can contain the following configuration options:

- `host`: RabbitMQ server hostname (default: 'rabbit').
- `vhost`: RabbitMQ virtual host (default: '/').
- `port`: RabbitMQ server port (default: 5672).
- `login`: RabbitMQ login (default: 'guest').
- `password`: RabbitMQ password (default: 'guest').
- `exchange`: RabbitMQ exchange for Nameko services (default: 'nameko-rpc').
- `timeout`: RPC call timeout in milliseconds (default: 30000).
- `reconnect`: Reconnect to RabbitMQ on connection loss (default: true).

## License
This project is licensed under the MIT License