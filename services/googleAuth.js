const { google } = require('googleapis');

function createOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getFreshClient(tokens) {
  const oauth2 = createOAuth2();
  if (tokens) oauth2.setCredentials(tokens);
  // Trigger refresh if needed
  try {
    const now = Date.now();
    const exp = tokens && tokens.expiry_date ? Number(tokens.expiry_date) : 0;
    if (!tokens || !tokens.access_token || (exp && now > exp - 60 * 1000)) {
      await oauth2.getAccessToken(); // will refresh using refresh_token if available
    }
  } catch (e) {
    // ignore; caller can handle errors
  }
  const newCreds = oauth2.credentials || {};
  return { oauth2, tokens: { access_token: newCreds.access_token, refresh_token: tokens?.refresh_token, expiry_date: newCreds.expiry_date } };
}

module.exports = { createOAuth2, getFreshClient };
