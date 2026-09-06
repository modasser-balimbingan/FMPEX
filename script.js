/* =========================================================
   ARDNET JAVASCRIPT
   Vanilla JavaScript only.
   ========================================================= */


/* =========================================================
   DEMO LISTINGS
   Edit this array to change the initial public listings.
   ========================================================= */

const defaultListings = [
  {
    id: 1,
    farmer: "Juan Dela Cruz",
    produce: "Rice",
    category: "grain",
    quantity: 250,
    unit: "kg",
    location: "Pagadian",
    price: 40,
    status: "Active"
  },
  {
    id: 2,
    farmer: "Maria Santos",
    produce: "Corn",
    category: "grain",
    quantity: 120,
    unit: "kg",
    location: "Santiago",
    price: 30,
    status: "Active"
  },
  {
    id: 3,
    farmer: "Abdul Rahman",
    produce: "Coconut",
    category: "coconut",
    quantity: 500,
    unit: "piece",
    location: "Kumalarang",
    price: 17,
    status: "Active"
  },
  {
    id: 4,
    farmer: "Fatima Ali",
    produce: "Banana",
    category: "fruit",
    quantity: 180,
    unit: "kg",
    location: "Mahinog",
    price: 27,
    status: "Active"
  },
  {
    id: 5,
    farmer: "Pedro Garcia",
    produce: "Tomato",
    category: "vegetable",
    quantity: 90,
    unit: "kg",
    location: "Pagadian",
    price: 52,
    status: "Active"
  },
  {
    id: 6,
    farmer: "Amina Karim",
    produce: "Sweet Potato",
    category: "vegetable",
    quantity: 140,
    unit: "kg",
    location: "Santiago",
    price: 34,
    status: "Active"
  }
];


let listings = loadListings();

let currentUser = JSON.parse(
  localStorage.getItem("ardnetCurrentUser") || "null"
);


/* =========================================================
   STORAGE
   ========================================================= */

function loadListings() {

  const saved = localStorage.getItem("ardnetListings");

  if (!saved) {

    localStorage.setItem(
      "ardnetListings",
      JSON.stringify(defaultListings)
    );

    return [...defaultListings];
  }

  try {
    return JSON.parse(saved);
  } catch (error) {

    localStorage.setItem(
      "ardnetListings",
      JSON.stringify(defaultListings)
    );

    return [...defaultListings];
  }
}


function saveListings() {

  localStorage.setItem(
    "ardnetListings",
    JSON.stringify(listings)
  );
}


/* =========================================================
   MODALS
   ========================================================= */

function openModal(id, preferredRole = null) {

  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.add("show");
  document.body.classList.add("modal-open");

  if (
    id === "registerModal" &&
    preferredRole
  ) {

    const roleSelect =
      document.getElementById("registerRole");

    if (roleSelect) {
      roleSelect.value = preferredRole;
    }
  }

  window.setTimeout(() => {

    const focusTarget =
      modal.querySelector(
        "input:not([type='hidden']), select, button"
      );

    if (focusTarget) {
      focusTarget.focus();
    }

  }, 50);
}


function closeModal(id) {

  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("show");

  document.body.classList.remove("modal-open");

  clearFormMessages();
}


function clearFormMessages() {

  document.querySelectorAll(
    ".form-message"
  ).forEach(element => {

    element.className = "form-message";
    element.textContent = "";

  });
}


/* Close modal by clicking outside the box. */

document.querySelectorAll(".modal").forEach(modal => {

  modal.addEventListener("click", event => {

    if (event.target === modal) {
      closeModal(modal.id);
    }

  });

});


/* =========================================================
   PASSWORD HASH DEMO
   =========================================================

   NOTE:
   This browser hash is ONLY for this standalone prototype.

   Production PHP must use:

   password_hash($password, PASSWORD_DEFAULT);

   and:

   password_verify($password, $storedHash);

   ========================================================= */

async function browserHash(text) {

  const encoder = new TextEncoder();

  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array
    .from(new Uint8Array(hashBuffer))
    .map(byte =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


/* =========================================================
   REGISTRATION
   ========================================================= */

document
  .getElementById("registerForm")
  .addEventListener("submit", async event => {

    event.preventDefault();

    const name =
      document.getElementById("registerName").value.trim();

    const email =
      document
        .getElementById("registerEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById("registerPassword").value;

    const role =
      document.getElementById("registerRole").value;

    const message =
      document.getElementById("registerMessage");


    if (
      !name ||
      !email ||
      password.length < 8
    ) {

      showFormMessage(
        message,
        "Please enter valid information and use at least 8 characters.",
        "error"
      );

      return;
    }


    const users =
      JSON.parse(
        localStorage.getItem("ardnetUsers") || "[]"
      );


    const existing =
      users.find(user =>
        user.email === email
      );


    if (existing) {

      showFormMessage(
        message,
        "An account with this email already exists.",
        "error"
      );

      return;
    }


    /*
      Demo account hash.

      Production:
      const hash = password_hash($password, PASSWORD_DEFAULT);
    */

    const passwordHash =
      await browserHash(password);


    const user = {
      id: Date.now(),
      name,
      email,
      passwordHash,
      role
    };


    users.push(user);


    localStorage.setItem(
      "ardnetUsers",
      JSON.stringify(users)
    );


    currentUser = user;


    localStorage.setItem(
      "ardnetCurrentUser",
      JSON.stringify(user)
    );


    showFormMessage(
      message,
      "Account created successfully.",
      "success"
    );


    window.setTimeout(() => {

      closeModal("registerModal");

      updateDashboard();

      openDashboard();

      showToast(
        "Welcome to ArdNet, " + name + "!"
      );

    }, 650);

  });


/* =========================================================
   LOGIN
   ========================================================= */

document
  .getElementById("loginForm")
  .addEventListener("submit", async event => {

    event.preventDefault();

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById("loginPassword").value;

    const message =
      document.getElementById("loginMessage");


    if (!email || !password) {

      showFormMessage(
        message,
        "Please enter your email and password.",
        "error"
      );

      return;
    }


    const users =
      JSON.parse(
        localStorage.getItem("ardnetUsers") || "[]"
      );


    const passwordHash =
      await browserHash(password);


    const user =
      users.find(account =>
        account.email === email &&
        account.passwordHash === passwordHash
      );


    if (!user) {

      showFormMessage(
        message,
        "Invalid email or password.",
        "error"
      );

      return;
    }


    currentUser = user;


    localStorage.setItem(
      "ardnetCurrentUser",
      JSON.stringify(user)
    );


    showFormMessage(
      message,
      "Login successful.",
      "success"
    );


    window.setTimeout(() => {

      closeModal("loginModal");

      updateDashboard();

      openDashboard();

      showToast(
        "Signed in successfully."
      );

    }, 600);

  });


/* =========================================================
   FORM FEEDBACK
   ========================================================= */

function showFormMessage(
  element,
  text,
  type
) {

  element.textContent = text;

  element.className =
    "form-message show " + type;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function openDashboard() {

  updateDashboard();

  document
    .getElementById("dashboardDrawer")
    .classList.add("show");
}


function closeDashboard() {

  document
    .getElementById("dashboardDrawer")
    .classList.remove("show");
}


function updateDashboard() {

  const name =
    document.getElementById("dashboardName");

  const warning =
    document.getElementById("dashboardLoginWarning");

  const listingCount =
    document.getElementById("dashboardListings");


  if (!currentUser) {

    name.textContent = "Farmer dashboard";

    warning.style.display = "block";

    listingCount.textContent =
      listings.length;

    return;
  }


  name.textContent =
    currentUser.name + "'s dashboard";

  warning.style.display = "none";


  const myListings =
    listings.filter(listing =>
      listing.farmer === currentUser.name &&
      listing.status === "Active"
    );


  listingCount.textContent =
    myListings.length;
}


document
  .getElementById("dashboardDrawer")
  .addEventListener("click", event => {

    if (
      event.target.id ===
      "dashboardDrawer"
    ) {

      closeDashboard();

    }

  });


/* =========================================================
   PRODUCE LISTING MODAL
   ========================================================= */

function openListingModal(
  listingId = null
) {

  if (
    !currentUser ||
    (
      currentUser.role !== "farmer" &&
      currentUser.role !== "admin"
    )
  ) {

    closeDashboard();

    openModal("loginModal");

    showToast(
      "Sign in as a farmer to manage listings."
    );

    return;
  }


  const form =
    document.getElementById("listingForm");

  form.reset();


  document.getElementById(
    "editListingId"
  ).value = "";


  document.getElementById(
    "listingTitle"
  ).textContent = "Create a listing";


  if (listingId !== null) {

    const listing =
      listings.find(item =>
        item.id === listingId
      );


    if (!listing) return;


    document.getElementById(
      "editListingId"
    ).value = listing.id;


    document.getElementById(
      "listingTitle"
    ).textContent = "Edit listing";


    document.getElementById(
      "produceName"
    ).value = listing.produce;


    document.getElementById(
      "produceCategory"
    ).value = listing.category;


    document.getElementById(
      "produceQuantity"
    ).value = listing.quantity;


    document.getElementById(
      "produceUnit"
    ).value = listing.unit;


    document.getElementById(
      "produceLocation"
    ).value = listing.location;


    document.getElementById(
      "producePrice"
    ).value = listing.price;

  }


  openModal("listingModal");
}


/* =========================================================
   SAVE / UPDATE LISTING
   ========================================================= */

document
  .getElementById("listingForm")
  .addEventListener("submit", event => {

    event.preventDefault();


    if (!currentUser) {

      closeModal("listingModal");

      openModal("loginModal");

      return;
    }


    const produce =
      document.getElementById("produceName")
        .value
        .trim();

    const category =
      document.getElementById("produceCategory")
        .value;

    const quantity =
      Number(
        document.getElementById("produceQuantity")
          .value
      );

    const unit =
      document.getElementById("produceUnit")
        .value;

    const location =
      document.getElementById("produceLocation")
        .value;

    const price =
      Number(
        document.getElementById("producePrice")
          .value
      );

    const editId =
      document.getElementById("editListingId")
        .value;


    const message =
      document.getElementById("listingMessage");


    if (
      !produce ||
      quantity <= 0 ||
      price < 0
    ) {

      showFormMessage(
        message,
        "Please enter valid listing information.",
        "error"
      );

      return;
    }


    if (editId) {

      const index =
        listings.findIndex(item =>
          item.id === Number(editId)
        );


      if (index === -1) return;


      const listing =
        listings[index];


      if (
        currentUser.role !== "admin" &&
        listing.farmer !== currentUser.name
      ) {

        showFormMessage(
          message,
          "You can only modify your own listing.",
          "error"
        );

        return;
      }


      listings[index] = {
        ...listing,
        produce,
        category,
        quantity,
        unit,
        location,
        price
      };

    } else {

      listings.unshift({
        id: Date.now(),
        farmer: currentUser.name,
        produce,
        category,
        quantity,
        unit,
        location,
        price,
        status: "Active"
      });

    }


    saveListings();

    renderListings();

    updateDashboard();


    showFormMessage(
      message,
      "Listing saved successfully.",
      "success"
    );


    window.setTimeout(() => {

      closeModal("listingModal");

      showToast(
        "Produce listing saved."
      );

    }, 650);

  });


/* =========================================================
   SEARCH / FILTER
   ========================================================= */

document
  .getElementById("searchInput")
  .addEventListener("input", renderListings);

document
  .getElementById("categoryFilter")
  .addEventListener("change", renderListings);

document
  .getElementById("locationFilter")
  .addEventListener("change", renderListings);


/* =========================================================
   RENDER LISTINGS
   ========================================================= */

function renderListings() {

  const grid =
    document.getElementById("listingGrid");


  const search =
    document
      .getElementById("searchInput")
      .value
      .trim()
      .toLowerCase();


  const category =
    document.getElementById("categoryFilter")
      .value;


  const location =
    document.getElementById("locationFilter")
      .value;


  const filtered =
    listings.filter(listing => {

      const matchesSearch =
        listing.produce
          .toLowerCase()
          .includes(search);


      const matchesCategory =
        category === "all" ||
        listing.category === category;


      const matchesLocation =
        location === "all" ||
        listing.location === location;


      const isActive =
        listing.status === "Active";


      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        isActive
      );

    });


  if (!filtered.length) {

    grid.innerHTML = `
      <div class="panel empty-state">
        <h3>No produce found</h3>
        <p>Try another search or filter.</p>
      </div>
    `;

    return;
  }


  grid.innerHTML =
    filtered
      .map(createListingCard)
      .join("");
}


/* =========================================================
   LISTING CARD
   ========================================================= */

function createListingCard(listing) {

  const canManage =
    currentUser &&
    (
      currentUser.role === "admin" ||
      currentUser.name === listing.farmer
    );


  return `
    <article class="listing-card">

      <div class="listing-top">
        <span class="listing-category">
          ${escapeHtml(listing.category)}
        </span>

        <span class="listing-status">
          ● ${escapeHtml(listing.status)}
        </span>
      </div>

      <h3>
        ${escapeHtml(listing.produce)}
      </h3>

      <div class="listing-meta">
        <span>
          Farmer: ${escapeHtml(listing.farmer)}
        </span>

        <span>
          Quantity:
          ${escapeHtml(String(listing.quantity))}
          ${escapeHtml(listing.unit)}
        </span>

        <span>
          Location:
          ${escapeHtml(listing.location)}
        </span>
      </div>

      <div class="listing-price">
        ₱${Number(listing.price).toFixed(2)}
        / ${escapeHtml(listing.unit)}
      </div>

      <div class="listing-actions">

        <button
          class="btn btn-outline btn-small"
          type="button"
          onclick="viewListing(${listing.id})"
        >
          View details
        </button>

        ${
          canManage
          ? `
            <button
              class="btn btn-outline btn-small"
              type="button"
              onclick="openListingModal(${listing.id})"
            >
              Edit
            </button>

            <button
              class="btn btn-warning btn-small"
              type="button"
              onclick="markListingSold(${listing.id})"
            >
              Mark sold
            </button>

            <button
              class="btn btn-danger btn-small"
              type="button"
              onclick="deleteListing(${listing.id})"
            >
              Delete
            </button>
          `
          : ""
        }

      </div>

    </article>
  `;
}


/* =========================================================
   VIEW LISTING
   ========================================================= */

function viewListing(id) {

  const listing =
    listings.find(item =>
      item.id === id
    );


  if (!listing) return;


  const details =
    [
      "Produce: " + listing.produce,
      "Category: " + listing.category,
      "Quantity: " +
        listing.quantity +
        " " +
        listing.unit,
      "Location: " + listing.location,
      "Farmer: " + listing.farmer,
      "Asking Price: ₱" +
        Number(listing.price).toFixed(2)
    ]
    .join("\n");


  alert(details);
}


/* =========================================================
   MARK LISTING SOLD
   ========================================================= */

function markListingSold(id) {

  const index =
    listings.findIndex(item =>
      item.id === id
    );


  if (index === -1) return;


  const listing =
    listings[index];


  if (
    !currentUser ||
    (
      currentUser.role !== "admin" &&
      listing.farmer !== currentUser.name
    )
  ) {

    showToast(
      "You can only modify your own listing."
    );

    return;
  }


  listing.status = "Sold";


  saveListings();

  renderListings();

  updateDashboard();

  showToast(
    "Listing marked as sold."
  );
}


/* =========================================================
   DELETE LISTING
   ========================================================= */

function deleteListing(id) {

  const listing =
    listings.find(item =>
      item.id === id
    );


  if (!listing) return;


  if (
    !currentUser ||
    (
      currentUser.role !== "admin" &&
      listing.farmer !== currentUser.name
    )
  ) {

    showToast(
      "You can only delete your own listing."
    );

    return;
  }


  if (
    !window.confirm(
      "Delete this produce listing?"
    )
  ) {
    return;
  }


  listings =
    listings.filter(item =>
      item.id !== id
    );


  saveListings();

  renderListings();

  updateDashboard();

  showToast(
    "Listing deleted."
  );
}


/* =========================================================
   MARKET PRICE REFRESH
   ========================================================= */

function refreshPrices(button) {

  if (!button) return;


  const oldText =
    button.textContent;


  button.textContent =
    "Refreshing...";

  button.disabled = true;


  window.setTimeout(() => {

    button.textContent =
      oldText;

    button.disabled = false;

    showToast(
      "Market reference data refreshed."
    );

  }, 800);
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(message) {

  const toast =
    document.getElementById("toast");


  toast.textContent =
    message;


  toast.classList.add("show");


  window.clearTimeout(
    toastTimer
  );


  toastTimer =
    window.setTimeout(() => {

      toast.classList.remove("show");

    }, 2800);
}


/* =========================================================
   SCROLL HELPER
   ========================================================= */

function scrollToSection(id) {

  const section =
    document.getElementById(id);


  if (!section) return;


  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   KEYBOARD ACCESS
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }


    document
      .querySelectorAll(".modal.show")
      .forEach(modal => {
        closeModal(modal.id);
      });


    closeDashboard();
  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderListings();

    updateDashboard();
  }
);
