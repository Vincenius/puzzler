import { MongoClient, ObjectId } from 'mongodb';
import { getIronSession } from 'iron-session';
import CryptoJS from 'crypto-js'

// merge session results into user
export const mergeUsers = async ({ user, session, db }) => {
  const userId = user._id.toString()
  const puzzlesCollection = db.collection('puzzles');
  const accountsCollection = db.collection('accounts');

  if (session.id) {
    const sessionPuzzles = await puzzlesCollection.find({[`solved.${session.id}`]: { $exists: true }}).toArray()

    await Promise.all(sessionPuzzles.map(p => {
      return p.solved[userId] !== true && p.solved[userId] !== false
        ? puzzlesCollection.updateOne(
          { _id: p._id },
          { $set: { [`solved.${userId}`]: p.solved[session.id] } }
        ) : Promise.resolve()
    }))
    await puzzlesCollection.updateMany(
      {[`solved.${session.id}`]: { $exists: true }},
      { $unset : { [`solved.${session.id}`] : 1} }
    )
    const sessionUser = await accountsCollection.findOne({ "_id" : ObjectId.createFromHexString(session.id) })
    // make sure to not accidentally delete an existing user
    if (sessionUser && !sessionUser.name) {
      await accountsCollection.deleteOne( { "_id" : ObjectId.createFromHexString(session.id) } );
    }
  }

  session.id = user._id.toString()
  await session.save()
}

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const accountsCollection = db.collection('accounts');
    const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY, ttl: 0 });

    if (req.method === 'GET') {
      let result = {}

      if (session.id) {
        const { _id, ...user } = await accountsCollection.findOne({ _id: ObjectId.createFromHexString(session.id) })
        result = {
          id: _id,
          ...user,
        }
      } else {
        const newUser = await accountsCollection.insertOne({
          createdAt: new Date().toISOString(),
        })
        const userId = newUser.insertedId.toString()
        result = { id: userId }
        session.id = userId
        await session.save()
      }

      res.status(200).json(result);
    } else if (req.method === 'POST') {
      const { type, username, password, passwordRepeat } = JSON.parse(req.body)
      let error
      if (type === 'CREATE') {
        if (password !== passwordRepeat) {
          error = { status: 400, message: 'Passwörter sind nicht gleich!' }
        } else {
          const result = await accountsCollection.findOne({ name: username })
          if (result && result._id) {
            error = { status: 409, message: 'Username existiert bereits!' }
          } else {
            const passHash = CryptoJS.SHA256(password, process.env.PASSWORD_HASH_SECRET).toString(
              CryptoJS.enc.Hex
            )
            await accountsCollection.updateOne(
              { _id: ObjectId.createFromHexString(session.id) },
              { $set: { name: username, password: passHash } }
            )
          }
        }
      } else {
        const passHash = CryptoJS.SHA256(password, process.env.PASSWORD_HASH_SECRET).toString(
          CryptoJS.enc.Hex
        )
        const user = await accountsCollection.findOne({ name: username })

        if (user && user.password === passHash) {
          await mergeUsers({ db, user, session })
        } else {
          error = {
            status: 401,
            message: 'Falsches Passwort!'
          }
        }
      }

      if (error && error.status) {
        res.status(error.status).json({ msg: error.message, error: true })
      } else {
        res.status(200).json({ id: session.id })
      }
    }
  } catch (error) {
    console.error('Error on fetching user:', error);
    res.status(500)
  } finally {
    // Close the connection
    client.close();
  }
}
