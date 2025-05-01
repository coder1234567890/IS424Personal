document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  //Page Ids
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

  //Firebase config
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
  const FV = firebase.firestore.FieldValue;

  const userRef = (uid) => db.doc(`users/${uid}`);
  const deviceRef = (id) => db.doc(`devices/${id}`);

  //page showing function
  function showPage(id) {
    pages.forEach((p) =>
      document.getElementById(p)?.classList.add("is-hidden")
    );
    document.getElementById(id)?.classList.remove("is-hidden");
    switch (id) {
      case "AdminDevicesPage":
        loadDevices();
        break;
      case "AdminRentalsPage":
        loadRentals();
        break;
      case "CurrentUsersPage":
        loadUsers();
        break;
      case "RentalHistoryPage":
        loadRentalHistory();
        break;
      case "main":
        loadDeviceOptions();
        break;
    }
  }

  const nav = {
    homePage: "main",
    reviewp: "About Page",
    loginPageclick: "loginPage",
    signupPageclick: "signupPage",
    manageDevicesPage: "AdminDevicesPage",
    manageRentalsPage: "AdminRentalsPage",
    manageUsersPage: "CurrentUsersPage",
    rentalHistoryPage: "RentalHistoryPage",
  };
  Object.entries(nav).forEach(([btn, page]) =>
    document
      .getElementById(btn)
      ?.addEventListener("click", () => showPage(page))
  );

  // authenticate user
  document
    .querySelector("#signupPage .button.is-info")
    ?.addEventListener("click", async () => {
      const email = document.querySelector(
        "#signupPage input[type='email']"
      ).value;
      const password = document.querySelector(
        "#signupPage input[type='password']"
      ).value;
      try {
        const { user } = await auth.createUserWithEmailAndPassword(
          email,
          password
        );
        await userRef(user.uid).set({
          displayName: user.displayName ?? "",
          email,
          role: "user",
          createdAt: FV.serverTimestamp(),
        });
        showPage("main");
      } catch (e) {
        if (e.code !== "permission-denied") console.error(e);
      }
    });

  document
    .querySelector("#loginPage .button.is-info")
    ?.addEventListener("click", async () => {
      const email = document.querySelector(
        "#loginPage input[type='email']"
      ).value;
      const password = document.querySelector(
        "#loginPage input[type='password']"
      ).value;
      try {
        const { user } = await auth.signInWithEmailAndPassword(email, password);
        const prof = userRef(user.uid);
        const snap = await prof.get();
        if (!snap.exists) {
          await prof.set({
            displayName: user.displayName ?? "",
            email,
            role: "user",
            createdAt: FV.serverTimestamp(),
          });
        }
        await prof.update({ lastLogin: FV.serverTimestamp() });
        showPage("main");
      } catch (e) {
        if (e.code !== "permission-denied") console.error(e);
      }
    });

  document
    .getElementById("logoutPage")
    ?.addEventListener("click", () => auth.signOut());

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      showPage("landing page");
      [
        "logoutPage",
        "manageDevicesPage",
        "manageRentalsPage",
        "manageUsersPage",
        "rentalHistoryPage",
        "homePage",
      ].forEach((id) =>
        document.getElementById(id)?.classList.add("is-hidden")
      );
      document.getElementById("loginPageclick")?.classList.remove("is-hidden");
      document.getElementById("signupPageclick")?.classList.remove("is-hidden");
      return;
    }

    showPage("main");
    document.getElementById("logoutPage")?.classList.remove("is-hidden");
    document.getElementById("loginPageclick")?.classList.add("is-hidden");
    document.getElementById("signupPageclick")?.classList.add("is-hidden");
    document.getElementById("homePage")?.classList.remove("is-hidden");
    document.getElementById("rentalHistoryPage")?.classList.remove("is-hidden");

    try {
      const [roleSnap, token] = await Promise.all([
        userRef(user.uid).get(),
        user.getIdTokenResult(),
      ]);
      const docAdmin = roleSnap.exists && roleSnap.data().role === "admin";
      const claimAdmin = !!token.claims.admin;
      const isAdmin = docAdmin || claimAdmin;

      //cache the claim into Firestore for next time
      if (claimAdmin && !docAdmin) {
        await userRef(user.uid).set({ role: "admin" }, { merge: true });
      }

      ["manageDevicesPage", "manageRentalsPage", "manageUsersPage"].forEach(
        (id) =>
          document.getElementById(id)?.classList.toggle("is-hidden", !isAdmin)
      );
    } catch (e) {
      console.error(e);
    }
  });

  //main page/rental request form
  document.getElementById("rentalSubmit")?.addEventListener("click", (e) => {
    e.preventDefault();
    submitRentalRequest();
  });

  async function submitRentalRequest() {
    const user = auth.currentUser;
    if (!user) return alert("Log in first.");

    const form = document.querySelector("#main .box");
    const [startDate, endDate, purpose] = [
      ...form.querySelectorAll("input.input"),
    ].map((i) => i.value.trim());
    const deviceId = form.querySelector("select")?.value;
    if (!deviceId) return alert("Choose a device.");

    const dRef = deviceRef(deviceId);
    const uRef = userRef(user.uid);
    const rRef = db.collection("rentals").doc();

    const batch = db.batch();
    batch.set(rRef, {
      device: dRef,
      user: uRef,
      startDate,
      endDate,
      purpose,
      status: "active",
      createdAt: FV.serverTimestamp(),
    });
    batch.update(dRef, { status: "checkedOut", currentRental: rRef });

    try {
      await batch.commit();
      alert("Rental submitted.");
      form.querySelectorAll("input, select").forEach((el) => {
        if (el.tagName === "SELECT") {
          el.selectedIndex = 0;
        } else {
          el.value = "";
        }
      });

      loadDeviceOptions();
    } catch (err) {
      alert(err.message);
    }
  }
  // loading devices in request form
  function loadDeviceOptions() {
    const sel = document.getElementById("deviceSelect");
    if (!sel) {
      console.warn("#deviceSelect not found");
      return;
    }
    sel.innerHTML = '<option value="">Loading…</option>';

    db.collection("devices")
      .get()
      .then((snap) => {
        let html = '<option value="">Select a device</option>';
        snap.forEach((doc) => {
          const data = doc.data();
          let status = data.status;
          // edit old docs
          if (!status) {
            status = "available";
            deviceRef(doc.id)
              .update({ status })
              .catch(() => {});
          }
          if (status === "available") {
            html += `<option value="${doc.id}">${
              data.name ?? "Unnamed"
            }</option>`;
          }
        });
        sel.innerHTML = html;
      })
      .catch((err) => {
        console.error("Device dropdown error", err);
        sel.innerHTML = '<option value="">Error loading devices</option>';
      });
  }

  //Admin devices page
  function loadDevices() {
    const c = document.getElementById("AdminDevicesPage");
    c.innerHTML = spinnerHTML();
    db.collection("devices")
      .get()
      .then((snap) => {
        let html = `<h1 class="title has-text-centered"><strong>Devices</strong></h1>
         <button id="addDeviceButton" class="button is-primary">Add Device</button>`;
        snap.forEach((doc) => {
          const d = doc.data();
          html += `
          <div class="box" data-id="${doc.id}">
            <h2 class="subtitle">${d.name ?? "Unnamed"} <small>(${
            d.status ?? "available"
          })</small></h2>
            <p><strong>Type:</strong> ${d.type ?? "N/A"}</p>
            <p><strong>Serial #:</strong> ${d.serialNumber ?? "N/A"}</p>
            <div class="buttons">
              <button class="button is-small is-info edit-device">Edit</button>
              <button class="button is-small is-danger delete-device">Delete</button>
            </div>
          </div>`;
        });
        c.innerHTML = html;

        document
          .getElementById("addDeviceButton")
          ?.addEventListener("click", addDevice);
        c.querySelectorAll(".edit-device").forEach((btn) =>
          btn.addEventListener("click", (e) =>
            editDevice(e.target.closest(".box").dataset.id)
          )
        );
        c.querySelectorAll(".delete-device").forEach((btn) =>
          btn.addEventListener("click", (e) =>
            deleteDevice(e.target.closest(".box").dataset.id)
          )
        );
      });
  }

  function addDevice() {
    const name = prompt("Device name:");
    if (!name) return;
    const type = prompt("Device type:") ?? "";
    const serialNumber = prompt("Serial number:") ?? "";
    db.collection("devices")
      .add({ name, type, serialNumber, status: "available" })
      .then(loadDevices);
  }
  function editDevice(id) {
    const newName = prompt("New name:");
    if (!newName) return;
    deviceRef(id).update({ name: newName }).then(loadDevices);
  }
  function deleteDevice(id) {
    if (!confirm("Delete device?")) return;
    deviceRef(id).delete().then(loadDevices);
  }

  //Rental manaegment page for amdins
  async function loadRentals() {
    const c = document.getElementById("AdminRentalsPage");
    c.innerHTML = spinnerHTML();
    const snap = await db.collection("rentals").get();
    let html = `<h1 class="title"><strong>Manage Rentals</strong></h1>`;
    for (const doc of snap.docs) {
      const d = doc.data();
      const devSnap = await d.device.get();
      const usrSnap = await d.user.get();
      html += `
        <div class="box" data-id="${doc.id}">
          <h2 class="subtitle">${usrSnap.data().email}</h2>
          <p><strong>Device:</strong> ${devSnap.data().name}</p>
          <p><strong>Purpose:</strong> ${d.purpose}</p>
          <p><strong>Status:</strong> ${d.status}</p>
          <p><strong>Start:</strong> ${
            d.startDate
          } &nbsp; <strong>End:</strong> ${d.endDate}</p>
          <div class="buttons">
            <button class="button is-small is-info edit-rental">Edit</button>
            <button class="button is-small is-danger delete-rental">Delete</button>
          </div>
        </div>`;
    }
    c.innerHTML = html;
    c.querySelectorAll(".edit-rental").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        editRental(e.target.closest(".box").dataset.id)
      )
    );
    c.querySelectorAll(".delete-rental").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        deleteRental(e.target.closest(".box").dataset.id)
      )
    );
  }

  function editRental(id) {
    const newPurpose = prompt("New purpose:");
    if (!newPurpose) return;
    db.collection("rentals")
      .doc(id)
      .update({ purpose: newPurpose })
      .then(loadRentals);
  }
  function deleteRental(id) {
    if (!confirm("Delete this rental?")) return;
    const rRef = db.collection("rentals").doc(id);
    db.runTransaction(async (t) => {
      const snap = await t.get(rRef);
      const dRef = snap.data().device;
      t.delete(rRef);
      t.update(dRef, { status: "available", currentRental: null });
    }).then(loadRentals);
  }

  //user management page for admins
  function loadUsers() {
    const c = document.getElementById("CurrentUsersPage");
    c.innerHTML = spinnerHTML();
    db.collection("users")
      .get()
      .then((snap) => {
        let html = `<h1 class="title"><strong>Current Users</strong></h1>`;
        snap.forEach((doc) => {
          const d = doc.data();
          html += `
          <div class="box" data-id="${doc.id}">
            <h2 class="subtitle">${d.displayName || d.email}</h2>
            <p><strong>Email:</strong> ${d.email}</p>
            <p><strong>Role:</strong> ${d.role}</p>
            <div class="buttons">
              <button class="button is-small is-info view-user">View Details</button>
              <button class="button is-small is-danger remove-user">Remove</button>
            </div>
          </div>`;
        });
        c.innerHTML = html;
        c.querySelectorAll(".view-user").forEach((btn) =>
          btn.addEventListener("click", (e) =>
            viewUser(e.target.closest(".box").dataset.id)
          )
        );
        c.querySelectorAll(".remove-user").forEach((btn) =>
          btn.addEventListener("click", (e) =>
            removeUser(e.target.closest(".box").dataset.id)
          )
        );
      });
  }
  function viewUser(uid) {
    userRef(uid)
      .get()
      .then((snap) => alert(JSON.stringify(snap.data(), null, 2)));
  }
  function removeUser(uid) {
    if (!confirm("Remove this user?")) return;
    userRef(uid).delete().then(loadUsers);
  }
  //users rental history
  function loadRentalHistory() {
    const user = auth.currentUser;
    const c = document.getElementById("RentalHistoryPage");
    c.innerHTML = spinnerHTML();
    if (!user) return alert("Log in first");
    const uRef = userRef(user.uid);

    const currentQ = db
      .collection("rentals")
      .where("user", "==", uRef)
      .where("status", "==", "active")
      .get();
    const pastQ = db
      .collection("rentals")
      .where("user", "==", uRef)
      .where("status", "==", "returned")
      .get();

    Promise.all([currentQ, pastQ]).then(async ([curSnap, pastSnap]) => {
      let html = `<h1 class="title has-text-centered"><strong>My Rentals</strong></h1>`;

      const render = async (snap, title, current) => {
        html += `<h2 class="subtitle has-text-centered"><strong>${title}</strong></h2>`;
        if (snap.empty) {
          html += `<p class="has-text-centered">None.</p>`;
          return;
        }
        html += `<div class="columns is-multiline is-centered">`;
        for (const doc of snap.docs) {
          const d = doc.data();
          const devSnap = await d.device.get();
          html += `
            <div class="column is-one-third">
              <div class="box has-text-centered" data-id="${doc.id}">
                <h2 class="subtitle">${devSnap.data().name}</h2>
                <p><strong>Purpose:</strong> ${d.purpose}</p>
                <p><strong>Start:</strong> ${
                  d.startDate
                } &nbsp; <strong>End:</strong> ${d.endDate}</p>
                ${
                  current
                    ? `<div class="buttons is-centered">
                         <button class="button is-small is-info extend-rental">Extend</button>
                         <button class="button is-small is-danger return-device">Return</button>
                       </div>`
                    : `<p><em>Returned</em></p>`
                }
              </div>
            </div>`;
        }
        html += `</div>`;
      };

      await render(curSnap, "Current Rentals", true);
      await render(pastSnap, "Past Rentals", false);

      c.innerHTML = html;
      c.querySelectorAll(".extend-rental").forEach((btn) =>
        btn.addEventListener("click", (e) =>
          extendRental(e.target.closest(".box").dataset.id)
        )
      );
      c.querySelectorAll(".return-device").forEach((btn) =>
        btn.addEventListener("click", (e) =>
          returnDevice(e.target.closest(".box").dataset.id)
        )
      );
    });
  }

  function extendRental(id) {
    const newEnd = prompt("New end date (YYYY-MM-DD):");
    if (!newEnd) return;
    db.collection("rentals").doc(id).update({ endDate: newEnd });
  }

  function returnDevice(id) {
    if (!confirm("Return device?")) return;
    const rRef = db.collection("rentals").doc(id);
    db.runTransaction(async (t) => {
      const snap = await t.get(rRef);
      const dRef = snap.data().device;
      t.update(rRef, { status: "returned", returnedAt: FV.serverTimestamp() });
      t.update(dRef, { status: "available", currentRental: null });
    }).then(loadRentalHistory);
  }
  //just something for fun to make it less clunky when loading things
  function spinnerHTML(msg = "Loading…") {
    return `
      <div class="has-text-centered py-6">
        <span class="icon is-large has-text-info">
          <i class="fas fa-spinner fa-pulse fa-2x"></i>
        </span>
        <p class="mt-3">${msg}</p>
      </div>`;
  }
});
