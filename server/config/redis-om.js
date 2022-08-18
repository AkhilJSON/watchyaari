// packages
import { Client } from 'redis-om'

/* pulls the Redis URL from .env */
const url = process.env.REDIS_OM_URL || "redis://localhost:6379"

/* create and open the Redis OM Client */
const client = await new Client().open(url)

export default client