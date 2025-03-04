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

  // Show the selected page and load dynamic content if applicable
  function showPage(pageId) {
    pages.forEach((id) => {
      const pageElement = document.getElementById(id);
      if (pageElement) {
        pageElement.classList.add("is-hidden");
      }
    });
    const page = document.getElementById(pageId);
    page.classList.remove("is-hidden");

    // Load dynamic content for admin pages when they are shown
    if (pageId === "AdminDevicesPage") {
      loadDevices();
    } else if (pageId === "AdminRentalsPage") {
      loadRentals();
    } else if (pageId === "CurrentUsersPage") {
      loadUsers();
    } else if (pageId === "RentalHistoryPage") {
      loadRentalHistory();
    } else if (pageId === "main") {
      // When showing the main rental request page, load the device options.
      loadDeviceOptions();
    }
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

  // Manage visibility based on login state and check admin claims
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("User is logged in:", user);
      showPage("main");
      document.getElementById("logoutPage").classList.remove("is-hidden");
      document.getElementById("loginPageclick").classList.add("is-hidden");
      document.getElementById("signupPageclick").classList.add("is-hidden");
      document.getElementById("homePage").classList.remove("is-hidden");

      // Check for admin custom claim
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          if (idTokenResult.claims.admin) {
            // Show admin pages for admin users
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
            // Hide admin pages for standard users
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
      document.getElementById("homePage").classList.add("is-hidden");
    }
  });

  // ===== Firestore CRUD functions for each page ===== //

  //mainpage
  const rentalSubmitButton = document.getElementById("rentalSubmit");
  if (rentalSubmitButton) {
    rentalSubmitButton.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default form submission
      submitRentalRequest();
    });
  }
  // Define the function that submits the rental request to Firestore
  function submitRentalRequest() {
    // Ensure a user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("You must be logged in to request a rental.");
      return;
    }

    // Locate the container of the rental form (assuming it's inside the #main .box)
    const container = document.querySelector("#main .box");
    if (!container) {
      alert("Rental form container not found.");
      return;
    }

    // Gather the form input values (assumes inputs in order: Start Date, End Date, Reason)
    const inputs = container.querySelectorAll("input.input");
    if (inputs.length < 3) {
      alert("Form inputs are missing.");
      return;
    }
    const startDate = inputs[0].value.trim();
    const endDate = inputs[1].value.trim();
    const reason = inputs[2].value.trim();

    // Get the selected device from the <select> element
    const deviceSelect = container.querySelector("select");
    const device = deviceSelect ? deviceSelect.value : "N/A";

    // Determine the userName from the logged-in user (fallback to email)
    const userName = user.displayName || user.email;

    // Create a new document in the "rentals" collection
    firebase
      .firestore()
      .collection("rentals")
      .add({
        userName: userName,
        device: device,
        purpose: reason,
        startDate: startDate,
        endDate: endDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        alert("Rental request submitted successfully.");
        // Optionally clear form fields after submission
        inputs.forEach((input) => (input.value = ""));
        if (deviceSelect) {
          deviceSelect.selectedIndex = 0;
        }
      })
      .catch((err) => {
        console.error("Error submitting rental request:", err);
        alert("Error submitting rental request. Please try again.");
      });
  }
  // Function to load device options from Firestore into the device dropdown
  function loadDeviceOptions() {
    const deviceSelect = document.getElementById("deviceSelect");
    if (!deviceSelect) return;

    db.collection("devices")
      .get()
      .then((snapshot) => {
        let optionsHTML = `<option value="">Select a device</option>`;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const deviceName = data.name || "Unnamed Device";
          // Option value is the document id; text is the device name
          optionsHTML += `<option value="${doc.id}">${deviceName}</option>`;
        });
        deviceSelect.innerHTML = optionsHTML;
      })
      .catch((error) => {
        console.error("Error loading devices for dropdown:", error);
      });
  }

  // When showing the Request Rental page ("main"), load device options
  if (
    document.getElementById("main") &&
    !document.getElementById("main").classList.contains("is-hidden")
  ) {
    loadDeviceOptions();
  }
  // Manage Devices Page (Devices Collection)
  function loadDevices() {
    const container = document.getElementById("AdminDevicesPage");
    db.collection("devices")
      .get()
      .then((snapshot) => {
        // Add an "Add Device" button at the top of the page
        let html = `<h1 class="title has-text-centered"><strong>Devices</strong></h1>
            <button id="addDeviceButton" class="button is-primary">Add Device</button>`;
        snapshot.forEach((doc) => {
          const data = doc.data();
          html += `
          <div class="box" data-id="${doc.id}">
            <h2 class="subtitle">${data.name || "Unnamed Device"}</h2>
            <p><strong>Device Type:</strong> ${data.type || "N/A"}</p>
            <p><strong>Serial Number:</strong> ${data.serialNumber || "N/A"}</p>
            <div class="buttons">
              <button class="button is-small is-info edit-device">Edit</button>
              <button class="button is-small is-danger delete-device">Delete</button>
            </div>
          </div>
        `;
        });
        container.innerHTML = html;

        // Attach event to the "Add Device" button
        const addDeviceBtn = document.getElementById("addDeviceButton");
        if (addDeviceBtn) {
          addDeviceBtn.addEventListener("click", addDevice);
        }

        // Attach event listeners for edit and delete buttons
        container.querySelectorAll(".edit-device").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            editDevice(id);
          });
        });
        container.querySelectorAll(".delete-device").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            deleteDevice(id);
          });
        });
      })
      .catch((err) => console.error("Error loading devices:", err));
  }
  function editDevice(id) {
    const newName = prompt("Enter new device name:");
    if (newName) {
      db.collection("devices")
        .doc(id)
        .update({ name: newName })
        .then(() => {
          alert("Device updated.");
          loadDevices();
        })
        .catch((err) => console.error("Error updating device:", err));
    }
  }

  function deleteDevice(id) {
    if (confirm("Are you sure you want to delete this device?")) {
      db.collection("devices")
        .doc(id)
        .delete()
        .then(() => {
          alert("Device deleted.");
          loadDevices();
        })
        .catch((err) => console.error("Error deleting device:", err));
    }
  }

  function addDevice() {
    // Prompt for new device details
    const name = prompt("Enter device name:");
    if (!name) return alert("Device name is required.");
    const type = prompt("Enter device type:");
    if (!type) return alert("Device type is required.");
    const serialNumber = prompt("Enter device serial number:");
    if (!serialNumber) return alert("Device serial number is required.");

    // Add the new device to Firestore
    db.collection("devices")
      .add({
        name: name,
        type: type,
        serialNumber: serialNumber,
      })
      .then(() => {
        alert("Device added successfully.");
        loadDevices(); // Reload devices to reflect the new entry
      })
      .catch((err) => console.error("Error adding device:", err));
  }

  // Manage Rentals Page (Rentals Collection)
  function loadRentals() {
    const container = document.getElementById("AdminRentalsPage");
    db.collection("rentals")
      .get()
      .then((snapshot) => {
        let html = `<h1 class="title"><strong>Manage Rentals</strong></h1>`;
        snapshot.forEach((doc) => {
          const data = doc.data();
          html += `
            <div class="box" data-id="${doc.id}">
              <h2 class="subtitle">${data.userName || "Unknown User"}</h2>
              <p><strong>Device:</strong> ${data.device || "N/A"}</p>
              <p><strong>Purpose:</strong> ${data.purpose || "N/A"}</p>
              <p><strong>Start Date:</strong> ${data.startDate || "N/A"}</p>
              <p><strong>End Date:</strong> ${data.endDate || "N/A"}</p>
              <div class="buttons">
                <button class="button is-small is-info edit-rental">Edit</button>
                <button class="button is-small is-danger delete-rental">Delete</button>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
        container.querySelectorAll(".edit-rental").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            editRental(id);
          });
        });
        container.querySelectorAll(".delete-rental").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            deleteRental(id);
          });
        });
      })
      .catch((err) => console.error("Error loading rentals:", err));
  }

  function editRental(id) {
    const newPurpose = prompt("Enter new purpose for rental:");
    if (newPurpose) {
      db.collection("rentals")
        .doc(id)
        .update({ purpose: newPurpose })
        .then(() => {
          alert("Rental updated.");
          loadRentals();
        })
        .catch((err) => console.error("Error updating rental:", err));
    }
  }

  function deleteRental(id) {
    if (confirm("Are you sure you want to delete this rental?")) {
      db.collection("rentals")
        .doc(id)
        .delete()
        .then(() => {
          alert("Rental deleted.");
          loadRentals();
        })
        .catch((err) => console.error("Error deleting rental:", err));
    }
  }

  // Manage Users Page (Users Collection)
  function loadUsers() {
    const container = document.getElementById("CurrentUsersPage");
    db.collection("users")
      .get()
      .then((snapshot) => {
        let html = `<h1 class="title"><strong>Current Users</strong></h1>`;
        snapshot.forEach((doc) => {
          const data = doc.data();
          html += `
            <div class="box" data-id="${doc.id}">
              <h2 class="subtitle">${data.username || "Unnamed User"}</h2>
              <p><strong>Email:</strong> ${data.email || "N/A"}</p>
              <div class="buttons">
                <button class="button is-small is-info view-user">View Details</button>
                <button class="button is-small is-danger remove-user">Remove</button>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
        container.querySelectorAll(".view-user").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            viewUser(id);
          });
        });
        container.querySelectorAll(".remove-user").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            removeUser(id);
          });
        });
      })
      .catch((err) => console.error("Error loading users:", err));
  }

  function viewUser(id) {
    db.collection("users")
      .doc(id)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          alert(
            `User Details:\nUsername: ${data.username}\nEmail: ${data.email}`
          );
        } else {
          alert("User not found.");
        }
      })
      .catch((err) => console.error("Error viewing user:", err));
  }

  function removeUser(id) {
    if (confirm("Are you sure you want to remove this user?")) {
      db.collection("users")
        .doc(id)
        .delete()
        .then(() => {
          alert("User removed.");
          loadUsers();
        })
        .catch((err) => console.error("Error removing user:", err));
    }
  }

  function loadRentalHistory() {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("Please log in to view your rentals.");
      return;
    }
    // Use displayName if available, otherwise fallback to email
    const userName = user.displayName || user.email;
    const container = document.getElementById("RentalHistoryPage");

    // Query current rentals from "rentals" collection
    const currentRentalsQuery = db
      .collection("rentals")
      .where("userName", "==", userName)
      .get();

    // Query past rentals from "rentalHistory" collection
    const pastRentalsQuery = db
      .collection("rentalHistory")
      .where("userName", "==", userName)
      .get();

    Promise.all([currentRentalsQuery, pastRentalsQuery])
      .then(([currentSnapshot, pastSnapshot]) => {
        const currentRentals = [];
        currentSnapshot.forEach((doc) => {
          currentRentals.push({ id: doc.id, ...doc.data() });
        });

        const pastRentals = [];
        pastSnapshot.forEach((doc) => {
          pastRentals.push({ id: doc.id, ...doc.data() });
        });

        let html = `<h1 class="title has-text-centered"><strong>My Rentals</strong></h1>`;

        // Current Rentals Section
        html += `<h2 class="subtitle has-text-centered"><strong>Current Rentals</strong></h2>`;
        if (currentRentals.length === 0) {
          html += `<p class="has-text-centered">No current rentals.</p>`;
        } else {
          html += `<div class="columns is-multiline is-centered">`;
          currentRentals.forEach((rental) => {
            html += `
              <div class="column is-one-third">
                <div class="box has-text-centered" data-id="${rental.id}">
                  <h2 class="subtitle">${rental.device || "Device"}</h2>
                  <p><strong>Purpose:</strong> ${rental.purpose || "N/A"}</p>
                  <p><strong>Start Date:</strong> ${
                    rental.startDate || "N/A"
                  }</p>
                  <p><strong>End Date:</strong> ${rental.endDate || "N/A"}</p>
                  <div class="buttons is-centered">
                    <button class="button is-small is-info extend-rental">Extend Rental</button>
                    <button class="button is-small is-danger return-device">Return Device</button>
                  </div>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }

        // Past Rentals Section
        html += `<h2 class="subtitle has-text-centered"><strong>Past Rentals</strong></h2>`;
        if (pastRentals.length === 0) {
          html += `<p class="has-text-centered">No past rentals.</p>`;
        } else {
          html += `<div class="columns is-multiline is-centered">`;
          pastRentals.forEach((rental) => {
            html += `
              <div class="column is-one-third">
                <div class="box has-text-centered" data-id="${rental.id}">
                  <h2 class="subtitle">${rental.device || "Device"}</h2>
                  <p><strong>Purpose:</strong> ${rental.purpose || "N/A"}</p>
                  <p><strong>Start Date:</strong> ${
                    rental.startDate || "N/A"
                  }</p>
                  <p><strong>End Date:</strong> ${rental.endDate || "N/A"}</p>
                  <div class="buttons is-centered">
                    <button class="button is-small is-info view-details">View Details</button>
                  </div>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        }

        container.innerHTML = html;

        // Attach event listeners for current rentals
        container.querySelectorAll(".extend-rental").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            extendRental(id);
          });
        });
        container.querySelectorAll(".return-device").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            returnDevice(id);
          });
        });
        // Attach event listener for past rentals' view details button
        container.querySelectorAll(".view-details").forEach((btn) => {
          btn.addEventListener("click", function (e) {
            const id = e.target.closest(".box").dataset.id;
            viewRentalDetails(id);
          });
        });
      })
      .catch((err) => console.error("Error loading rentals:", err));
  }

  function extendRental(id) {
    const newEndDate = prompt("Enter new end date (YYYY-MM-DD):");
    if (newEndDate) {
      db.collection("rentalHistory")
        .doc(id)
        .update({ endDate: newEndDate })
        .then(() => {
          alert("Rental extended.");
          loadRentalHistory();
        })
        .catch((err) => console.error("Error extending rental:", err));
    }
  }

  function returnDevice(id) {
    if (confirm("Mark this rental as returned?")) {
      // Optionally update rental status (here we set a 'returned' field)
      db.collection("rentalHistory")
        .doc(id)
        .update({ returned: true })
        .then(() => {
          alert("Device returned.");
          loadRentalHistory();
        })
        .catch((err) => console.error("Error returning device:", err));
    }
  }
});

// SPA Code for in-page content loading (if needed)
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
          <!-- Users content will be loaded dynamically -->
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
