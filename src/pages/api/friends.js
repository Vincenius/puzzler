import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';

export default async function handler(req, res) {
    if (req.method === 'POST') {
      const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY, ttl: 0 });

      if (session.id) {
        const client = new MongoClient(process.env.MONGODB_URI);
        try {
          await client.connect();
          const db = client.db(process.env.MONGODB_DB);
          const accountsCollection = db.collection('accounts');

          const { type, id } = JSON.parse(req.body)
          const user = await accountsCollection.findOne({ _id: ObjectId.createFromHexString(session.id) });

          if (type === 'ADD') {
            if (user && (!user.friends || !user.friends.includes(id))) {
              await accountsCollection.updateOne(
                { _id: ObjectId.createFromHexString(session.id) },
                { $push: { friends: id } }
              );
            }
          } else if (type === 'REMOVE') {
            if (user && user.friends && user.friends.includes(id)) {
              await accountsCollection.updateOne(
                { _id: ObjectId.createFromHexString(session.id) },
                { $pull: { friends: id } }
              );
            }
          }

          res.status(200).send()
          // add or remove friend
        } catch (error) {
          console.error('Error on fetching user:', error);
          res.status(500)
        } finally {
          // Close the connection
          client.close();
        }
      } else {
        res.status(500).send()
      }
    } else {
      res.status(404).send()
    }
}
