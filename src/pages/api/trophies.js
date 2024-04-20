import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const accountsCollection = db.collection('accounts');
    const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY });

    if (req.method === 'GET' && session.id) {
      let result = {}

      await accountsCollection.updateOne(
        { _id: ObjectId.createFromHexString(session.id) },
        { $set: { "trophies.$[].new": false } }
      )

      res.status(200).json(result);
    } else {
      res.status(400).json({})
    }
  } catch (error) {
    console.error('Error on fetching user:', error);
    res.status(500)
  } finally {
    // Close the connection
    client.close();
  }
}
