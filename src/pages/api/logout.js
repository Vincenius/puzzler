import { getIronSession } from 'iron-session';

export default async function handler(req, res) {
  const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.SESSION_KEY, ttl: 0 });
  session.destroy()
  await session.save()

  res.status(200).json({});
}