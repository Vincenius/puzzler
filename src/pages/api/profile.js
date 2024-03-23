import { MongoClient, ObjectId, ISODate } from 'mongodb';
import { getIronSession } from 'iron-session';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const client = new MongoClient(process.env.MONGODB_URI);
    const result = {
      status: 200,
      json: {}
    }

    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_DB);
      const puzzlesCollection = db.collection('puzzles');
      const accountsCollection = db.collection('accounts');

      const user = await accountsCollection.findOne({ name: req.query.username })

      if (!user) {
        result.status = 404
      } else {
        const query = {
          $and: [
            { date: { $exists: true } },
            { [`solved.${user._id.toString()}`]: { $exists: true } }
          ]
        };
        const puzzles = await puzzlesCollection.find(query).toArray()

        result.json = {
          user,
          puzzles,
        }
      }
    } catch (error) {
      console.error('Error on fetching profile:', error);
    } finally {
      // Close the connection
      client.close();
    }

    res.status(result.status).json(result.json);
  }
}
