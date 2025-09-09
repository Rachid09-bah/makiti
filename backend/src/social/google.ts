import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_secret_change_me';

// Config: définir dans l'env GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT=http://localhost:4000/api/v1/auth/oauth/google/callback, FRONTEND_ORIGIN=http://localhost:5173
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const oauthGoogleStart = (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = process.env.OAUTH_REDIRECT || `${req.protocol}://${req.get('host')}/api/v1/auth/oauth/google/callback`;
  const scope = encodeURIComponent('openid email profile');
  const state = encodeURIComponent(Math.random().toString(36).slice(2));
  const url = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  return res.redirect(url);
};

export const oauthGoogleCallback = async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '');
    if (!code) return res.status(400).json({ message: 'Missing code' });
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = process.env.OAUTH_REDIRECT || `${req.protocol}://${req.get('host')}/api/v1/auth/oauth/google/callback`;

    // Exchange code -> token
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }) as any
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    if (!accessToken) return res.status(400).json({ message: 'Token exchange failed', details: tokenJson });

    // Fetch profile
    const userRes = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = await userRes.json();
    const email = String(profile.email || '').toLowerCase();
    const name = String(profile.name || profile.given_name || 'Utilisateur');
    if (!email) return res.status(400).json({ message: 'No email in profile' });

    // Upsert user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, role: 'customer', verified: true, passwordHash: 'oauth' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: '1h' });
    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const redirect = `${frontend}/oauth/callback?token=${encodeURIComponent(token)}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role)}`;
    return res.redirect(redirect);
  } catch (err: any) {
    return res.status(500).json({ message: 'OAuth error', error: err?.message });
  }
};
