import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';
import { getFirstDayOfMonth, getLastDayOfMonth, formatISODate } from '@/utils/dateHelper'

export default async function handler(req, res) {

  if (req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`) {
    const today = new Date();

    if (today.getDate() === 14) { // todo change to 1
      today.setMonth(today.getMonth() - 1);
      const from = formatISODate(getFirstDayOfMonth(today.toISOString()))
      const to = formatISODate(getLastDayOfMonth(today.toISOString()))
      const { leaderboard } = await fetch(process.env.BASE_URL + `/api/leaderboards?from=${from}&to=${to}`).then(res => res.json())
      const sortedLeaderboard = leaderboard.sort((a, b) => b.solved - a.solved).slice(0, 3);
      const leaderBoardRanks = []
      let rank = 1;
      let prevPoints = sortedLeaderboard[0].solved;

      for (let i = 0; i < sortedLeaderboard.length; i++) {
        if (prevPoints === sortedLeaderboard[i].solved) {
          leaderBoardRanks.push({ ...sortedLeaderboard[i], rank })
        } else {
          rank = i+1;
          leaderBoardRanks.push({ ...sortedLeaderboard[i], rank })
        }
        prevPoints = sortedLeaderboard[i].solved;
      }

      const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB);
        const accountsCollection = db.collection('accounts');

        await Promise.all(
          leaderBoardRanks.map(u => accountsCollection.updateOne(
            { _id: ObjectId.createFromHexString(u.id) },
            { $push: { trophies: {
              "category": "month",
              "description": `${u.rank}. Platz März 2024`,
              "color": u.rank === 1 ? 'gold' : u.rank === 2 ? 'silver' : 'bronze',
              "new": true
            } } }
          ))
        )
        res.status(200).json({})
      } catch (error) {
        console.error('Error on fetching user:', error);
        res.status(500)
      } finally {
        // Close the connection
        client.close();
      }
    } else {
      res.status(200).json({})
    }
  } else {
    res.status(401).json({})
  }
}
