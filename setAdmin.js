// setAdmin.js
//to add an admin account
// use node setAdmin.js user@example.com
//make sure that you are doing this on terminal and that you are in the project directory
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Admin SDK with your service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Retrieve the email from the command-line arguments
const email = process.argv[2];

if (!email) {
  console.error("Usage: node setAdmin.js user@example.com");
  process.exit(1);
}

// Get the user by email and set the admin custom claim
admin
  .auth()
  .getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`Success! Admin claim set for ${email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error setting admin claim:", error);
    process.exit(1);
  });
