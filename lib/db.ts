import mongoose from "mongoose"

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Add it to .env.local, e.g. MONGODB_URI=mongodb://127.0.0.1:27017/babynest"
  )
}

const MONGODB_URI: string = process.env.MONGODB_URI

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Cached on the global object so hot reload in development reuses the same
// connection instead of opening a new one on every module re-evaluation.
declare global {
  var mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cache

/** Connects to MongoDB, reusing the cached connection/in-flight promise across hot reloads. */
async function connectToDatabase() {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => mongooseInstance)
  }

  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null
    throw error
  }

  return cache.conn
}

export default connectToDatabase
