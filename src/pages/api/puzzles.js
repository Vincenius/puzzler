import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';

const getPipeline = (minValue, maxValue) => [{
  $addFields: {
    ratingInt: { $toInt: "$Rating" },
    popularityInt: { $toInt: "$Popularity" },
    ratingDeviationInt: { $toInt: "$RatingDeviation" },
  }
}, {
  $match: {
    ratingInt: { $gte: minValue, $lte: maxValue },
    date: { $exists: false }
  }
}, {
  $sort: {
    "popularityInt": -1,
    "ratingDeviationInt": 1
  }
}, {
  $limit: 1
}]

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('puzzler');
    const puzzlesCollection = db.collection('puzzles');

    if (req.method === 'GET') {
      let result = {}
      const today = new Date().toISOString().slice(0, 10)
      const puzzles = await puzzlesCollection.find({ date: today }).toArray()

      if (puzzles.length === 0) { // generate puzzles for today if not done already
        const ratings = [[1200,1400],[1400,1600],[1600,1800],[1800,2000],[2000,2200]]
        const newPuzzles = await Promise.all(
          ratings.map((arr) => puzzlesCollection.aggregate(getPipeline(arr[0], arr[1])).toArray())
        )
        result = newPuzzles.flat().map(p => ({ ...p, solved: {}}))
        const puzzleIdsToUpdate = result.map((puzzle) => puzzle._id);

        // Update puzzles with the extracted ids
        await puzzlesCollection.updateMany(
          { _id: { $in: puzzleIdsToUpdate } },
          { $set: { date: today, solved: {} } }
        );
      } else {
        result = puzzles
      }

      res.status(200).json(result);
    } else if (req.method === 'PUT') {
      const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY });
      const { success, id } = JSON.parse(req.body)
      const updateKey = `solved.${session.id}`
      await puzzlesCollection.updateOne({
        _id: ObjectId.createFromHexString(id) },
        { $set: { [updateKey]: success  }
      })

      res.status(200).json({});
    }
  } catch (error) {
    console.error('Error on puzzles endpoint:', error);
  } finally {
    // Close the connection
    client.close();
  }
}
