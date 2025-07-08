const db = require('./src/config/database');

console.log('=== DEBUG DATABASE STATE ===');

// Check if app exists
const app = db.getAppByClientId('client_4amjw54ug');
console.log('App exists:', !!app);
if (app) {
  console.log('App client_id:', app.client_id);
  console.log('App client_secret:', app.client_secret);
}

// Check if auth code exists
const authCode = db.getAuthorizationCode('b0d5aee22ac3a4bb1d71d1277b3636f2d08e16cb8e03069ddcd6ac1da537742f');
console.log('Auth code exists:', !!authCode);
if (authCode) {
  console.log('Auth code client_id:', authCode.client_id);
  console.log('Auth code redirect_uri:', authCode.redirect_uri);
}

// List all apps
console.log('\nAll apps:');
const allApps = db.getAllApps();
allApps.forEach(app => {
  console.log(`- ${app.client_id}: ${app.name}`);
});

console.log('\n=== END DEBUG ==='); 