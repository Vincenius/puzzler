import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';

const getQuery = (timeframe) => {
  const query = [{ "solved": { $ne: {} } }]
  if (timeframe === 'day') {
    query.push({ date: {
      $eq: new Date().toISOString().slice(0, 10) // Today's date in YYYY-MM-DD format
    } })
  } else if (timeframe === 'week') {
    const beginningOfWeek = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1)))
    query.push({ date: {
      $gte: beginningOfWeek.toISOString().slice(0, 10),
    } })
  } else if (timeframe === 'month') {
    const beginningOfMonth = new Date();
    beginningOfMonth.setDate(1);
    query.push({ date: {
      $gte: beginningOfMonth.toISOString().slice(0, 10),
    } })
  } else {
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
      const query = getQuery(req.query.q) // maybe use from-to query instead
      const puzzles = await puzzlesCollection.find(query).toArray()
      const userIds = [...new Set(puzzles.map(p => Object.keys(p.solved)).flat())]
      const objectIds = userIds.map(id => ObjectId.createFromHexString(id))
      const users = await accountsCollection.find({ _id: { $in: objectIds } }).toArray();
      const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY });
      result = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        solved: puzzles.filter(p => p.solved[u._id.toString()]).length,
        isPlayer: session.id === u._id.toString(),
      }))
    } catch (error) {
      console.error('Error on fetching user:', error);
    } finally {
      // Close the connection
      client.close();
    }

    res.status(200).json(result);
  }
}
