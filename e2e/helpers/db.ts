import { MongoClient } from 'mongodb'

const MONGO_URI = 'mongodb+srv://pv121416an_db_user:adfpYFz78pX0tRjY@glimmoracare.uue9xh0.mongodb.net/?appName=glimmoracare'
const DB_NAME = 'care_db'

let client: MongoClient | null = null

async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
  }
  return client
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
  }
}

/**
 * Poll MongoDB for a dev_otp field in a collection.
 * Returns the plaintext OTP once it appears (up to 10s).
 */
export async function getDevOtp(
  collection: 'phone_otps' | 'email_verification_tokens' | 'password_reset_tokens' | 'two_factor_sms_enroll' | 'two_factor_email_enroll',
  query: Record<string, string>,
): Promise<string> {
  const c = await getClient()
  const col = c.db(DB_NAME).collection(collection)
  for (let i = 0; i < 20; i++) {
    const doc = await col.findOne({ ...query, dev_otp: { $exists: true } })
    if (doc?.dev_otp) return String(doc.dev_otp)
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`dev_otp not found in ${collection} for query ${JSON.stringify(query)}`)
}

/**
 * Find a user by email and return their _id as string.
 */
export async function getUserId(email: string): Promise<string> {
  const c = await getClient()
  const doc = await c.db(DB_NAME).collection('users').findOne({ email })
  if (!doc) throw new Error(`User not found: ${email}`)
  return String(doc._id)
}
