const amqp = require('amqplib');
const {
  EXCHANGE,
  ROUTING_KEY,
  ensureTopology,
} = require('./rabbitmqTopology');

let connection;
let channel;
let connecting;

async function getPublisherChannel() {
  if (channel && connection) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    connection = await amqp.connect(url);
    connection.on('error', (error) => {
      console.error('[RabbitMQ publisher] Connection error:', error.message);
    });
    connection.on('close', () => {
      connection = null;
      channel = null;
      console.warn('[RabbitMQ publisher] Connection closed; it will reconnect on the next publish.');
    });
    channel = await connection.createConfirmChannel();
    await ensureTopology(channel);
    return channel;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

async function publishPriceAlertEvent(event) {
  const publisher = await getPublisherChannel();
  const payload = Buffer.from(JSON.stringify(event));
  const accepted = publisher.publish(EXCHANGE, ROUTING_KEY, payload, {
    persistent: true,
    contentType: 'application/json',
    messageId: event.eventId,
    timestamp: Date.now(),
  });
  
  if (!accepted) {
    await new Promise((resolve) => publisher.once('drain', resolve));
  }
  await publisher.waitForConfirms();
}

module.exports = { publishPriceAlertEvent };
