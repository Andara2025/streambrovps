const express = require('express');
const crypto = require('crypto');
const { getAuthUrl, exchangeCodeForTokens, getYouTubeClient } = require('../config/google');
const { db } = require('../db/database');

const router = express.Router();

// GET /oauth2/login - start OAuth flow
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauth_state = state;
  const url = getAuthUrl(state);
  return res.redirect(url);
});

// GET /oauth2/callback - handle Google OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).render('error', { title: 'OAuth Error', message: error, error: { message: String(error) } });
    }
    if (!code || !state || state !== req.session.oauth_state) {
      return res.status(400).render('error', { title: 'OAuth Error', message: 'Invalid state or code', error: { message: 'Invalid state or code' } });
    }

    const tokens = await exchangeCodeForTokens(code);

    // Persist tokens to session for now; also save to DB if userId available
    req.session.youtubeTokens = tokens;
    const userId = req.session && (req.session.userId || req.session.user_id);
    if (userId) {
      const expiry = tokens.expiry_date || (tokens.expiry_date === 0 ? 0 : null);
      db.run(`INSERT INTO youtube_tokens(user_id, access_token, refresh_token, expiry_date)
              VALUES(?, ?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET
                access_token=excluded.access_token,
                refresh_token=COALESCE(excluded.refresh_token, youtube_tokens.refresh_token),
                expiry_date=excluded.expiry_date,
                updated_at=CURRENT_TIMESTAMP`,
        [userId, tokens.access_token || null, tokens.refresh_token || null, expiry],
        (err) => {
          if (err) console.warn('[OAuth] Failed to persist youtube_tokens:', err.message);
        }
      );
    }

    // Fetch channel basic info for UI badge
    try {
      const yt = getYouTubeClient(tokens);
      const me = await yt.channels.list({ mine: true, part: ['snippet','statistics'] });
      const channel = me?.data?.items?.[0];
      if (channel) {
        req.session.youtubeChannel = {
          id: channel.id,
          title: channel.snippet?.title,
          avatar: channel.snippet?.thumbnails?.default?.url || channel.snippet?.thumbnails?.high?.url || null,
          subs: channel.statistics?.subscriberCount || null
        };
      }
    } catch (apiErr) {
      // ignore here; tokens may still be valid
      console.warn('YouTube API test failed:', apiErr?.message);
    }

    // Flash success and redirect to dashboard
    req.session.flash = { type: 'success', message: 'YouTube connected' };
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).render('error', { title: 'Error', message: 'OAuth callback failed', error: err });
  }
});

// GET /oauth2/youtube/me - test endpoint to fetch channel info
router.get('/youtube/me', async (req, res) => {
  try {
    if (!req.session.youtubeTokens) return res.status(401).json({ error: 'Not connected' });
    const yt = getYouTubeClient(req.session.youtubeTokens);
    const response = await yt.channels.list({ mine: true, part: ['snippet','statistics'] });
    return res.json(response.data);
  } catch (err) {
    console.error('YouTube me error:', err);
    return res.status(500).json({ error: 'Failed to fetch channel info' });
  }
});

module.exports = router;

// GET /oauth2/disconnect - revoke local session (simple disconnect)
router.get('/disconnect', async (req, res) => {
  try {
    const userId = req.session && (req.session.userId || req.session.user_id);
    if (userId) {
      try {
        db.run('DELETE FROM youtube_tokens WHERE user_id = ?', [userId], (err) => {
          if (err) console.warn('[OAuth] Failed to delete youtube_tokens on disconnect:', err.message);
        });
      } catch (e) {
        console.warn('[OAuth] Disconnect DB cleanup error:', e?.message);
      }
    }
    delete req.session.youtubeTokens;
    delete req.session.youtubeChannel;
    req.session.flash = { type: 'info', message: 'YouTube disconnected' };
  } catch {}
  return res.redirect('/dashboard');
});
