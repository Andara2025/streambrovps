const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Runtime guard (non-fatal): log if envs are missing
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error('[OAuth] Missing env vars. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI are set');
}

const YT_SCOPES = [
  // Full access for streaming management; switch to youtube.readonly if you only need read-only
  'https://www.googleapis.com/auth/youtube'
];

function getAuthUrl(state) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: YT_SCOPES,
    state: state || 'streambro',
    include_granted_scopes: true,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
  // Minimal debug logging (no secrets)
  try {
    const cidLen = (process.env.GOOGLE_CLIENT_ID || '').length;
    console.log(`[OAuth] Generated auth URL. client_id length=${cidLen}, redirect_uri=${process.env.GOOGLE_REDIRECT_URI}`);
  } catch {}
  return url;
}

async function exchangeCodeForTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function getYouTubeClient(tokens) {
  oauth2Client.setCredentials(tokens);
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

module.exports = { oauth2Client, getAuthUrl, exchangeCodeForTokens, getYouTubeClient };
