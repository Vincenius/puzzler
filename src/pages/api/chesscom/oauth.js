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
  const client_id = process.env.CHESS_COM_CLIENT_ID
  const redirect_uri = encodeURIComponent(`${process.env.BASE_URL}/api/chesscom/callback`)
  const code_challenge_method = 'S256'
  const verifier = createVerifier()
  const code_challenge = createChallenge(verifier)
  const scope = 'openid profile email'
  const uri = `https://oauth.chess.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}&scope=${scope}`

  const session = await getIronSession(req, res, { password: process.env.SESSION_PASSWORD, cookieName: process.env.OAUTH_COOKIE, ttl: 0 });
  session.verifier = verifier
  await session.save()

  res.redirect(uri);
}