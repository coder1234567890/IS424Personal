// removeAdmin.js
//to remove an admin account
// use node removeAdmin.js user@example.com
//make sure that you are doing this on terminal and that you are in the project directory
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get the target user's email from the command-line arguments
const email = process.argv[2];

if (!email) {
  console.error("Usage: node removeAdmin.js user@example.com");
  process.exit(1);
}

// Fetch the user by email and remove their custom claims
admin
  .auth()
  .getUserByEmail(email)
  .then((user) => {
    // Remove all custom claims (or set to {} if you have others you want to preserve)
    return admin.auth().setCustomUserClaims(user.uid, null);
  })
  .then(() => {
    console.log(`Success! Admin claim removed for ${email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error removing admin claim:", error);
    process.exit(1);
  });
