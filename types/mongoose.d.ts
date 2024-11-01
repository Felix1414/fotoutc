import mongoose from 'mongoose'

declare global {
  var mongoose: {
    promise: Promise<typeof mongoose> | null;
    conn: typeof mongoose | null;
  } | undefined
}