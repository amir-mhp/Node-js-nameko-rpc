const events = require('events');
const amqp = require('amqp');
const uuid = require('uuid');
const winston = require('winston-color');

class NamekoClient extends events.EventEmitter {
    constructor(options = {}, onError) {
        super();
        this._options = {
            host: 'rabbit',
            vhost: '/',
            port: 5672,
            login: 'guest',
            password: 'guest',
            exchange: 'nameko-rpc',
            timeout: 30000,
            reconnect: true,
            ...options
        };

        if (options.logger) {
            this.logger = options.logger;
        } else {
            this.logger = winston;
            winston.level = options.debug_level || 'info';
        }

        this._conn = amqp.createConnection(
            {
                host: this._options.host,
                vhost: this._options.vhost,
                port: this._options.port,
                login: this._options.login,
                password: this._options.password,
            },
            {
                reconnect: this._options.reconnect
            }
        );

        this._conn.on('error', (e) => {
            this.logger.error('AMQP error:', e.stack);
            onError(e);
        });

        this._requests = {};

        this._conn.once('ready', () => {
            this.logger.debug(`Connected to ${this._options.host}:${this._options.port}`);
            this._exchange = this._conn.exchange(this._options.exchange, {
                type: 'topic',
                durable: true,
                autoDelete: false
            });

            this._exchange.removeAllListeners('error').on('error', (e) => {
                this.logger.error(`Exchange error: ${e}`);
                onError(e.stack);
            });

            this._exchange.removeAllListeners('open').on('open', () => {
                this.logger.debug(`Selected exchange ${this._options.exchange}`);
                this._responseQueueName = `rpc-node-response-${uuid.v4()}`;
                let ctag;

                const replyQueue = this._conn.queue(this._responseQueueName, { exclusive: true }, (replyQueue) => {
                    this.logger.debug(`Connected to reply queue ${this._responseQueueName}`);
                    replyQueue.bind(this._options.exchange, this._responseQueueName);

                    replyQueue.subscribe((message, headers, deliveryInfo, messageObject) => {
                        const cid = messageObject.correlationId;
                        const request = this._requests[cid];
                        if (request) {
                            this.logger.debug(`[${cid}] Received response`);
                            clearTimeout(request.timeout);
                            if (!message.error) {
                                request.onSuccess(message.result);
                            } else {
                                request.onError(new Error(`${message.error.exc_path}: ${message.error.value}`));
                            }
                        } else {
                            this.logger.error(`[${cid}] Received response with unknown cid!`);
                        }
                        delete this._requests[cid];
                    }).addCallback((ok) => {
                        ctag = ok.consumerTag;
                        this.logger.debug('Nameko client ready!');
                        this.emit('ready', this);
                    });
                });
            });
        });
    }

    call(service, method, args, kwargs) {
        const options = this._options;

        const body = {
            args: args || [],
            kwargs: kwargs || {}
        };

        const correlationId = uuid.v4();

        const promise = new Promise((resolve, reject) => {
            let ctag;

            this.logger.debug(`[${correlationId}] Calling ${service}.${method}(...)`);
            this._requests[correlationId] = {
                onSuccess: resolve,
                onError: reject,
                timeout: setTimeout(() => {
                    delete this._requests[correlationId];
                    this.logger.error(`[${correlationId}] Timed out: no response within ${options.timeout} ms.`);
                    reject({
                        exc_path: null,
                        value: `${service}.${method}`,
                        exc_type: 'Timeout',
                        exc_args: [service, method]
                    });
                }, options.timeout)
            };
            this._exchange.publish(
                `${service}.${method}`,
                JSON.stringify(body),
                {
                    contentType: 'application/json',
                    replyTo: this._responseQueueName,
                    headers: {
                        'nameko.call_id_stack': 'standalone_rpc_proxy.call.bar'
                    },
                    correlationId: correlationId,
                    exchange: options.exchange
                },
                (a, b, c) => {
                    this.logger.debug('Publish:', a, b, c);
                }
            );
        });

        return promise;
    }

    close() {
        this._conn.disconnect();
    }
}

const connect = (options, onError) => {
    return new Promise((resolve, reject) => {
        const client = new NamekoClient(options, reject);
        client.once('ready', () => {
            resolve(client);
        });
    });
};

exports.NamekoClient = NamekoClient;
exports.connect = connect;
