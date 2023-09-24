const redis = require('redis');

const redisClient = redis.createClient({
  host: '127.0.0.1', // Endereço IP padrão para localhost
  port: 6379, // Porta padrão do Redis
});

redisClient.setMaxListeners(0);
redisClient.select(9);

redisClient.on('connect', function() {
  console.log('Conectado ao Redis');
});

redisClient.on('error', function(err) {
  console.error('Erro ao conectar ao Redis:', err);
});

module.exports = redisClient;
