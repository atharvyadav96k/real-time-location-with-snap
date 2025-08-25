const client = require('./redisClient');

exports.storeLocationById = async (id, location)=>{
    await client.set(`vehicle:latest:${id}`, JSON.stringify(location));
    console.log(id, location);
}