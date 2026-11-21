const EXCHANGE = 'ardnet.price-alerts.exchange';
const ROUTING_KEY = 'price-alert';
const QUEUE = 'ardnet.price-alerts';
const RETRY_QUEUE = 'ardnet.price-alerts.retry';
const DEAD_EXCHANGE = 'ardnet.price-alerts.dead.exchange';
const DEAD_QUEUE = 'ardnet.price-alerts.dead';
const RETRY_DELAY_MS = 15000;

async function ensureTopology(channel) {
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
  await channel.assertExchange(DEAD_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DEAD_EXCHANGE,
      'x-dead-letter-routing-key': 'dead',
    },
  });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': RETRY_DELAY_MS,
      'x-dead-letter-exchange': EXCHANGE,
      'x-dead-letter-routing-key': ROUTING_KEY,
    },
  });
  await channel.assertQueue(DEAD_QUEUE, { durable: true });
  await channel.bindQueue(DEAD_QUEUE, DEAD_EXCHANGE, 'dead');
}

module.exports = {
  EXCHANGE,
  ROUTING_KEY,
  QUEUE,
  RETRY_QUEUE,
  DEAD_QUEUE,
  RETRY_DELAY_MS,
  ensureTopology,
};
