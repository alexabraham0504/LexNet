const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  keyFile: './config/credentials/gen-lang-client-0211780297-e10ebf9f18e8.json',
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

module.exports = auth; 