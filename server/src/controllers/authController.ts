import { Request, Response } from 'express';
import { User, SenderAccount } from '../models';

export const getAuthConfig = async (_req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    return res.json({
      success: true,
      clientId,
      configured: !!clientId,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const googleLoginController = async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, googleId, accessToken, refreshToken, code } = req.body;

    let finalAccessToken = accessToken;
    let finalRefreshToken = refreshToken;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // If an authorization code was sent, exchange it for tokens with Google
    if (code && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          finalAccessToken = tokenData.access_token;
          if (tokenData.refresh_token) {
            finalRefreshToken = tokenData.refresh_token;
          }

          // Fetch user profile from Google if not already provided
          if (!userEmail && finalAccessToken) {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${finalAccessToken}` },
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              userEmail = profile.email;
              userName = userName || profile.name;
              userAvatar = userAvatar || profile.picture;
              userGoogleId = userGoogleId || profile.sub;
            }
          }
        } else {
          console.warn('[Google Auth] Code exchange failed:', await tokenRes.text());
        }
      } catch (exchangeErr: any) {
        console.warn('[Google Auth] Code exchange error:', exchangeErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Upsert User in database
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        $set: {
          name: userName || 'Google User',
          avatar: userAvatar || null,
        },
        $setOnInsert: {
          email: userEmail,
        },
      },
      { upsert: true, new: true }
    );

    // If access token is available, upsert SenderAccount so user can send emails via their Google account
    if (finalAccessToken) {
      await SenderAccount.findOneAndUpdate(
        { email: userEmail },
        {
          $set: {
            name: userName || 'Google User',
            accessToken: finalAccessToken,
            refreshToken: finalRefreshToken || undefined,
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            isEthereal: false,
            active: true,
          },
          $setOnInsert: {
            email: userEmail,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[Google Auth] Registered Gmail SenderAccount for: ${userEmail}`);
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        accessToken: finalAccessToken,
      },
    });
  } catch (err: any) {
    console.error('[Google Auth Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getMeController = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email query parameter required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, user: { ...user.toObject(), id: user._id.toString() } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
