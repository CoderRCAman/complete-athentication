const redis = require('redis');
const client = redis.createClient(); // can set paramets like post , host {port :value,host:value}

client.on('connect', () => {
    console.log("client connected tp redis....");
})

client.on('ready', () => {
    console.log("Client connected and ready to use");
})

client.on('end', () => {
    console.log("Client disconnected");
})


client.on('error', (err) => {
    console.log(err);
})

process.on('SIGINT', () => {
    client.quit();
})

module.exports = client;