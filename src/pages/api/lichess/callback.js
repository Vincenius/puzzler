import { getIronSession } from 'iron-session';
import { MongoClient, ObjectId } from 'mongodb';
import { mergeUsers } from '../users'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.OAUTH_COOKIE });
  const data = {
    grant_type: 'authorization_code',
    code: req.query.code,
    uri: 'https://lichess.org/oauth',
    code_verifier: session.verifier,
    redirect_uri: `${process.env.BASE_URL}/api/lichess/callback`,
    client_id: 'puzzler',
    scope: 'email:read', // follow:read ???
  }
  const formBody = [];
  for (let property in data) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  const formBodyString = formBody.join("&");

  try {
    const authData = await fetch('https://lichess.org/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBodyString
    }).then(res => res.json())

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.access_token}`
    }

    const [account, emailRes] = await Promise.all([
      fetch('https://lichess.org/api/account', { headers }).then(res => res.json()),
      fetch('https://lichess.org/api/account/email', { headers }).then(res => res.json()),
    ])

    const { username, url } = account
    const { email } = emailRes

    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const accountsCollection = db.collection('accounts');
    const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY });

    const user = await accountsCollection.findOne({ name: username, type: 'LICHESS' })
    if (!user || !user._id) {
      await accountsCollection.updateOne(
        { _id: ObjectId.createFromHexString(session.id) },
        { $set: { name: username, url, email, type: 'LICHESS' } }
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