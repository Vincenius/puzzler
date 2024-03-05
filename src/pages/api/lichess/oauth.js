import crypto, { verify } from 'crypto'
import { getIronSession } from 'iron-session';

const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest();
const createVerifier = () => base64URLEncode(crypto.randomBytes(32));
const createChallenge = (verifier) => base64URLEncode(sha256(verifier));

// see https://lichess.org/api#tag/OAuth/operation/oauth
export default async function handler(req, res) {
  const response_type = 'code'
  const client_id = 'puzzler'
  const redirect_uri = encodeURIComponent(`${process.env.BASE_URL}/api/lichess/callback`)
  const code_challenge_method = 'S256'
  const verifier = createVerifier()
  const code_challenge = createChallenge(verifier)
  const scope = 'email:read'
  const uri = `https://lichess.org/oauth?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&code_challenge_method=${code_challenge_method}&code_challenge=${code_challenge}&scope=${scope}`

  const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.OAUTH_COOKIE });
  session.verifier = verifier
  await session.save()

  res.redirect(uri);
}