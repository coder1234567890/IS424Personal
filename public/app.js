document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");

  const pages = [
    "landing page",
    "main",
    "About Page",
    "loginPage",
    "signupPage",
    "AdminDevicesPage",
    "AdminRentalsPage",
    "CurrentUsersPage",
    "RentalHistoryPage",
  ];

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDPpcgBJG97tuFMe_ts2tRyt_S8j0Roslg",
    authDomain: "info-sys-471-project.firebaseapp.com",
    projectId: "info-sys-471-project",
    storageBucket: "info-sys-471-project.firebasestorage.app",
    messagingSenderId: "1029901678751",
    appId: "1:1029901678751:web:0c1b04a75440e8eee7caaa",
    measurementId: "G-7C7NVRQM0E",
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Show the selected page and hide others
  function showPage(pageId) {
    pages.forEach((id) => {
      const pageElement = document.getElementById(id);
      if (pageElement) {
        pageElement.classList.add("is-hidden");
      }
    });
    document.getElementById(pageId).classList.remove("is-hidden");
  }

  // Handle page navigation
  const buttons = {
    homePage: "main",
    reviewp: "About Page",
    loginPageclick: "loginPage",
    signupPageclick: "signupPage",
    manageDevicesPage: "AdminDevicesPage",
    manageRentalsPage: "AdminRentalsPage",
    manageUsersPage: "CurrentUsersPage",
    rentalHistoryPage: "RentalHistoryPage",
  };

  Object.keys(buttons).forEach((buttonId) => {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
      buttonElement.addEventListener("click", () =>
        showPage(buttons[buttonId])
      );
    }
  });

  // Firebase login functionality
  const loginButton = document.querySelector("#loginPage .button.is-info");
  if (loginButton) {
    loginButton.addEventListener("click", function () {
      const email = document.querySelector(
        "#loginPage input[type='email']"
      ).value;
      const password = document.querySelector(
        "#loginPage input[type='password']"
      ).value;

      auth
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("User logged in:", userCredential.user);
          showPage("main");
        })
        .catch((error) => {
          console.error("Login error:", error.message);
          alert(error.message);
        });
    });
  }

  // Firebase sign-up functionality
  const signUpButton = document.querySelector("#signupPage .button.is-info");
  if (signUpButton) {
    signUpButton.addEventListener("click", function () {
      const email = document.querySelector(
        "#signupPage input[type='email']"
      ).value;
      const password = document.querySelector(
        "#signupPage input[type='password']"
      ).value;

      auth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("User signed up:", userCredential.user);
          showPage("main");
        })
        .catch((error) => {
          console.error("Sign-up error:", error.message);
          alert(error.message);
        });
    });
  }

  // Firebase logout functionality
  const logoutButton = document.getElementById("logoutPage");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      auth
        .signOut()
        .then(() => {
          console.log("User signed out");
          showPage("landing page");
        })
        .catch((error) => {
          console.error("Logout error:", error.message);
          alert(error.message);
        });
    });
  }

  // Manage visibility based on login state
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("User is logged in:", user);
      showPage("main");
      document.getElementById("logoutPage").classList.remove("is-hidden");
      document.getElementById("loginPageclick").classList.add("is-hidden");
      document.getElementById("signupPageclick").classList.add("is-hidden");

      // Check for admin custom claim
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          if (idTokenResult.claims.admin) {
            // Show admin pages
            document
              .getElementById("manageDevicesPage")
              .classList.remove("is-hidden");
            document
              .getElementById("manageRentalsPage")
              .classList.remove("is-hidden");
            document
              .getElementById("manageUsersPage")
              .classList.remove("is-hidden");
          } else {
            // Hide admin pages
            document
              .getElementById("manageDevicesPage")
              .classList.add("is-hidden");
            document
              .getElementById("manageRentalsPage")
              .classList.add("is-hidden");
            document
              .getElementById("manageUsersPage")
              .classList.add("is-hidden");
          }
        })
        .catch((error) => {
          console.error("Error checking custom claims:", error);
        });

      document
        .getElementById("rentalHistoryPage")
        .classList.remove("is-hidden");
    } else {
      console.log("No user logged in");
      showPage("landing page");
      document.getElementById("logoutPage").classList.add("is-hidden");
      document.getElementById("loginPageclick").classList.remove("is-hidden");
      document.getElementById("signupPageclick").classList.remove("is-hidden");
      document.getElementById("manageDevicesPage").classList.add("is-hidden");
      document.getElementById("manageRentalsPage").classList.add("is-hidden");
      document.getElementById("manageUsersPage").classList.add("is-hidden");
      document.getElementById("rentalHistoryPage").classList.add("is-hidden");
    }
  });
});
// SPA Code
function loadContent(section) {
  const content = document.getElementById("main");

  if (section === "Home") {
    content.innerHTML = `
        <div class="box">
          <h2 class="title is-4">Home</h2>
          <form>
            <div class="field">
              <label class="label">Start Date</label>
              <div class="control">
                <input class="input" type="text" placeholder="Enter Start Date">
              </div>
            </div>
            <div class="field">
              <label class="label">End Date</label>
              <div class="control">
                <input class="input" type="email" placeholder="Enter End Date">
              </div>
            </div>
            <div class="field">
              <label class="label">Reason For Rental</label>
              <div class="control">
                <input class="input" type="text" placeholder="Enter Reason for Rental">
              </div>
            </div>
            <div class="control"></div>
          </form>
        </div>
      `;
  } else if (section === "About") {
    content.innerHTML = `
        <div class="content">
          <h2 class="title is-4">About This Site</h2>
          <p>This platform was designed to streamline laptop rentals for employees at Clack Corporation, built by the IT department. Our goal is to provide a simple and efficient way for team members to check out and manage laptops for work purposes.</p>
        </div>
      `;
  } else if (section === "Login") {
    content.innerHTML = `
        <div class="box">
          <h2 class="title is-4">Login</h2>
          <form>
            <div class="field">
              <label class="label">Email</label>
              <div class="control">
                <input class="input" type="email" placeholder="Enter your email">
              </div>
            </div>
            <div class="field">
              <label class="label">Password</label>
              <div class="control">
                <input class="input" type="password" placeholder="Enter your password">
              </div>
            </div>
            <div class="control">
              <button class="button is-primary">Login</button>
            </div>
          </form>
        </div>
      `;
  } else if (section === "Sign Up") {
    content.innerHTML = `
        <div class="box">
          <h2 class="title is-4">Sign Up</h2>
          <form>
            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" type="text" placeholder="Enter your full name">
              </div>
            </div>
            <div class="field">
              <label class="label">Email</label>
              <div class="control">
                <input class="input" type="email" placeholder="Enter your email">
              </div>
            </div>
            <div class="field">
              <label class="label">Password</label>
              <div class="control">
                <input class="input" type="password" placeholder="Enter your password">
              </div>
            </div>
            <div class="control">
              <button class="button is-primary">Sign Up</button>
            </div>
          </form>
        </div>
      `;
  } else if (section === "Manage Users") {
    content.innerHTML = `
        <div class="box">
          <h2 class="title is-4">Manage Users</h2>
          <!-- Manage Users content here -->
        </div>
      `;
  } else if (section === "Contact IT") {
    content.innerHTML = `
        <div class="box">
          <h2 class="title is-4">Contact IT</h2>
          <p>If you have any issues, please reach out to the IT department.</p>
        </div>
      `;
  }
}
