// packages
import bluebird from "bluebird";
import redis from "redis";

bluebird.promisifyAll(redis);

const client = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    // password: process.env.REDIS_PASS || 'password',
});

export default client;
