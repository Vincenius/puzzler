import { MongoClient, ObjectId, ISODate } from 'mongodb';
import { getIronSession } from 'iron-session';

const getQuery = ({ from, to }) => {
  const query = [] // { "solved": { $ne: {} } }

  if (from) {
    const start = new Date(from);
    const dayBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000)

    query.push({ date: {
      $gt: dayBefore.toISOString()
    } })
  }
  if (to) {
    const end = new Date(to);

    query.push({ date: {
      $lte: end.toISOString()
    } })
  }

  if (!from && !to) {
    query.push({ date: {
      $exists: true,
    } })
  }

  return { $and: query }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const client = new MongoClient(process.env.MONGODB_URI);
    let result = {}

    try {
      await client.connect();
      const db = client.db('puzzler');
      const puzzlesCollection = db.collection('puzzles');
      const accountsCollection = db.collection('accounts');
      const query = getQuery(req.query)
      const addDetails = req.query.details === 'true'
      const puzzles = await puzzlesCollection.find(query).toArray()
      const userIds = [...new Set(puzzles.map(p => Object.keys(p.solved)).flat())]
      const objectIds = userIds.map(id => ObjectId.createFromHexString(id))
      const users = await accountsCollection.find({ _id: { $in: objectIds } }).toArray();
      const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY });
      result = {
        leaderboard: users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          solved: puzzles.filter(p => p.solved[u._id.toString()]).length,
          isPlayer: session.id === u._id.toString(),
        })),
        details: addDetails && puzzles
      }
    } catch (error) {
      console.error('Error on fetching user:', error);
    } finally {
      // Close the connection
      client.close();
    }

    res.status(200).json(result);
  }
}
