import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';
import { getFirstDayOfMonth, getLastDayOfMonth, formatISODate, getMonthDate } from '@/utils/dateHelper'

export default async function handler(req, res) {

  console.log('DBG CRON', req.headers)
  const auth = req.headers['authorization'] || req.headers['Authorization']
  if (auth === `Bearer ${process.env.CRON_SECRET}`) {
    console.log('CRON Triggered')
    const today = new Date();

    // if (today.getDate() === 1) {
      today.setMonth(today.getMonth() - 1);
      const from = formatISODate(getFirstDayOfMonth(today.toISOString()))
      const to = formatISODate(getLastDayOfMonth(today.toISOString()))
      console.log('DBG CRON', from, to)
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

      console.log('DBG CRON 2', leaderBoardRanks)

      const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB);
        const accountsCollection = db.collection('accounts');

        console.log('CRON DBG update users')
        console.log(getMonthDate(today))
        await Promise.all(
          leaderBoardRanks.map(u => accountsCollection.updateOne(
            { _id: ObjectId.createFromHexString(u.id) },
            { $push: { trophies: {
              "category": "month",
              "description": `${u.rank}. Platz ${getMonthDate(today)} 2024`,
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
    // } else {
    //   res.status(200).json({})
    // }
  } else {
    res.status(401).json({})
  }
}
