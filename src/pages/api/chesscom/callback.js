import { getIronSession } from 'iron-session';
import { MongoClient, ObjectId } from 'mongodb';
import { mergeUsers } from '../users'

function parseJwt (token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

export default async function handler(req, res) {
  const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.OAUTH_COOKIE, ttl: 0 });
  const data = {
    grant_type: 'authorization_code',
    code: req.query.code,
    code_verifier: session.verifier,
    redirect_uri: `${process.env.BASE_URL}/api/chesscom/callback`,
    client_id: process.env.CHESS_COM_CLIENT_ID,
  }
  const formBody = [];
  for (let property in data) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  const formBodyString = formBody.join("&");

  try {
    const authData = await fetch('https://oauth.chess.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBodyString
    }).then(res => res.json())

    const result = parseJwt(authData.id_token)
    const { preferred_username, email, profile } = result

    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const accountsCollection = db.collection('accounts');
    const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY, ttl: 0 });

    const user = await accountsCollection.findOne({ name: preferred_username, type: 'CHESSCOM' })
    if (!user || !user._id) {
      await accountsCollection.updateOne(
        { _id: ObjectId.createFromHexString(session.id) },
        { $set: { name: preferred_username, url: profile, email, type: 'CHESSCOM' } }
      )
    } else {
      await mergeUsers({ user, session, db })
    }

    res.redirect('/?success=true')
  } catch (err) {
    console.log(err)
    res.redirect('/?success=false')
  }
}