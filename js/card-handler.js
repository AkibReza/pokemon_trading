document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  const username = localStorage.getItem("username");
  if (!username) {
    window.location.href = "landing.html";
    return;
  }

  // Event listener for Apply Filters button
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyFilters);
  }

  // Event listener for Clear Filters button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
  }

  // Restore filters from localStorage
  restoreFilters();

  // Fetch and display cards initially
  fetchCards();
});

// Apply filters based on input values
function applyFilters() {
  const searchInput = document.getElementById("searchInput").value.trim();
  const selectedTypes = Array.from(
    document.querySelectorAll(".type-checkbox:checked")
  ).map((cb) => cb.value);
  const sortOption = document.getElementById("sortOption").value;
  const sortOrder = document.getElementById("sortOrder").value;

  // Save filters to localStorage
  saveFilters(searchInput, selectedTypes, sortOption, sortOrder);

  fetchCards(searchInput, selectedTypes, sortOption, sortOrder);
}

// Clear all filters
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document
    .querySelectorAll(".type-checkbox")
    .forEach((cb) => (cb.checked = false));
  document.getElementById("sortOption").value = "name";
  document.getElementById("sortOrder").value = "asc";

  localStorage.removeItem("pokemonFilters");
  fetchCards();
}

// Save filters to localStorage
function saveFilters(search, types, sort, order) {
  const filters = {
    search: search,
    types: types,
    sort: sort,
    order: order,
  };
  localStorage.setItem("pokemonFilters", JSON.stringify(filters));
}

// Restore filters from localStorage
function restoreFilters() {
  const savedFilters = localStorage.getItem("pokemonFilters");
  if (savedFilters) {
    const filters = JSON.parse(savedFilters);

    document.getElementById("searchInput").value = filters.search || "";
    document.getElementById("sortOption").value = filters.sort || "name";
    document.getElementById("sortOrder").value = filters.order || "asc";

    if (filters.types && filters.types.length > 0) {
      document.querySelectorAll(".type-checkbox").forEach((cb) => {
        cb.checked = filters.types.includes(cb.value);
      });
    }
  }
}

// Fetch and display cards based on filters
let allCards = [];
function fetchCards(search = "", types = [], sort = "name", order = "asc") {
  const url = "/pokemon_trading/fetch_cards.php";
  const params = new URLSearchParams();

  if (search.trim() !== "") {
    params.append("search", search);
  }

  if (Array.isArray(types) && types.length > 0) {
    params.append("type", types.join(","));
  }

  params.append("sort", sort);
  params.append("order", order);

  fetch(url + "?" + params.toString())
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      allCards = data;
      displayCards(allCards);
    })
    .catch((error) => {
      console.error("Fetch Error:", error);
      document.getElementById("cardContainer").innerHTML =
        '<div class="error-message">Error fetching cards.</div>';
    });
}

function displayCards(cards) {
  const container = document.getElementById("cardContainer");
  const emptyState = document.getElementById("emptyState");
  const userRole = localStorage.getItem("role");
  container.innerHTML = "";

  if (!cards || cards.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";

  cards.forEach((card) => {
    const imagePath = card.image_url
      ? `images/${card.image_url}`
      : "images/default.png";

    const typeClass = card.type ? card.type.toLowerCase() : "normal";

    // Generate action buttons based on user role
    let actionButtons = "";
    if (userRole === "admin") {
      actionButtons = `
        <button onclick="editCard(${card.id})" class="action-btn edit-btn">
          Edit
        </button>
        <button onclick="deleteCard(${card.id})" class="action-btn delete-btn">
          Delete
        </button>
      `;
    } else {
      const escapedName = card.name.replace(/'/g, "\\'");
      actionButtons = `
        <button onclick="openBuyModal(${
          card.id
        }, '${escapedName}', '${imagePath}', ${
        card.price || 0
      })" class="action-btn buy-btn">
          💰 Buy (${card.price || "0"} PC)
        </button>
      `;
    }

    const cardElement = document.createElement("div");
    cardElement.className = `pokemon-card type-${typeClass}`;
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-header">
          <h3 class="card-name">${card.name || "Unknown"}</h3>
          <span class="card-hp">${card.health || "0"} HP</span>
        </div>
        
        <div class="card-image-container">
          <img src="${imagePath}" alt="${card.name}" class="card-image" />
        </div>
        
        <div class="card-type">
          <span class="type-badge type-${typeClass}">${
      card.type || "Normal"
    }</span>
        </div>
        
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">Power</span>
            <span class="stat-value">${card.power || "0"}</span>
          </div>
          ${
            userRole === "admin"
              ? `
          <div class="stat">
            <span class="stat-label">Price</span>
            <span class="stat-value">${card.price || "0"} PC</span>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="card-actions">
          ${actionButtons}
        </div>
      </div>
    `;

    container.appendChild(cardElement);
  });

  // Animate all cards at once
  anime({
    targets: ".pokemon-card",
    scale: [0.8, 1],
    opacity: [0, 1],
    translateY: [50, 0],
    delay: anime.stagger(100),
    duration: 600,
    easing: "easeOutElastic(1, .8)",
  });
}

function deleteCard(cardId) {
  if (confirm("Are you sure you want to delete this card?")) {
    fetch(`delete_card.php?id=${cardId}`, { method: "POST" })
      .then((response) => response.text())
      .then((data) => {
        // Animate card removal
        const cardElement = document.querySelector(
          `.pokemon-card:has(button[onclick*="${cardId}"])`
        );
        if (cardElement) {
          anime({
            targets: cardElement,
            scale: 0,
            opacity: 0,
            duration: 400,
            easing: "easeInQuad",
            complete: function () {
              allCards = allCards.filter((card) => card.id !== cardId);
              displayCards(allCards);
            },
          });
        } else {
          allCards = allCards.filter((card) => card.id !== cardId);
          displayCards(allCards);
        }
      })
      .catch((error) => {
        alert("Error deleting card");
        console.error(error);
      });
  }
}

function editCard(cardId) {
  const card = allCards.find((c) => c.id === cardId);

  document.getElementById("editId").value = card.id;
  document.getElementById("editName").value = card.name;
  document.getElementById("editHealth").value = card.health;
  document.getElementById("editPower").value = card.power;
  document.getElementById("editType").value = card.type;
  document.getElementById("editPrice").value = card.price;

  const modal = document.getElementById("editModal");
  modal.style.display = "block";

  // Animate modal entrance
  anime({
    targets: ".modal-content",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: "easeOutQuad",
  });
}

document.querySelector(".close").onclick = function () {
  const modal = document.getElementById("editModal");
  anime({
    targets: ".modal-content",
    scale: [1, 0.8],
    opacity: [1, 0],
    duration: 300,
    easing: "easeInQuad",
    complete: function () {
      modal.style.display = "none";
    },
  });
};

window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    anime({
      targets: ".modal-content",
      scale: [1, 0.8],
      opacity: [1, 0],
      duration: 300,
      easing: "easeInQuad",
      complete: function () {
        modal.style.display = "none";
      },
    });
  }
};

function submitEdit() {
  const id = document.getElementById("editId").value;
  const updatedCard = {
    id: id,
    name: document.getElementById("editName").value,
    health: parseInt(document.getElementById("editHealth").value),
    power: parseInt(document.getElementById("editPower").value),
    type: document.getElementById("editType").value,
    price: parseInt(document.getElementById("editPrice").value),
  };

  fetch("update_card.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedCard),
  })
    .then((response) => response.text())
    .then((data) => {
      allCards = allCards.map((card) =>
        card.id === parseInt(id) ? { ...card, ...updatedCard } : card
      );
      displayCards(allCards);

      const modal = document.getElementById("editModal");
      anime({
        targets: ".modal-content",
        scale: [1, 0.8],
        opacity: [1, 0],
        duration: 300,
        easing: "easeInQuad",
        complete: function () {
          modal.style.display = "none";
        },
      });
    })
    .catch((error) => {
      alert("Error updating card");
      console.error(error);
    });
}

// Buy modal functions
let pendingBuyCardId = null;

function openBuyModal(cardId, cardName, cardImage, cardPrice) {
  pendingBuyCardId = cardId;
  const userBalance = parseInt(localStorage.getItem("pokecoins") || "0");
  const afterBalance = userBalance - cardPrice;

  document.getElementById("buyCardImage").src = cardImage;
  document.getElementById("buyCardName").textContent = cardName;
  document.getElementById("buyCardPrice").textContent =
    cardPrice + " PokeCoins";
  document.getElementById("buyUserBalance").textContent =
    userBalance + " PokeCoins";
  document.getElementById("buyAfterBalance").textContent =
    afterBalance + " PokeCoins";
  document.getElementById("buyAfterBalance").style.color =
    afterBalance < 0 ? "#e74c3c" : "#27ae60";

  const modal = document.getElementById("buyModal");
  modal.style.display = "block";

  // Animate modal entrance
  anime({
    targets: ".buy-modal-content",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: "easeOutQuad",
  });
}

function closeBuyModal() {
  const modal = document.getElementById("buyModal");
  anime({
    targets: ".buy-modal-content",
    scale: [1, 0.8],
    opacity: [1, 0],
    duration: 300,
    easing: "easeInQuad",
    complete: function () {
      modal.style.display = "none";
      pendingBuyCardId = null;
    },
  });
}

function confirmBuyCard() {
  if (!pendingBuyCardId) return;

  fetch("purchase_card.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card_id: pendingBuyCardId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // Update PokeCoins in localStorage and UI
        localStorage.setItem("pokecoins", data.new_pokecoins);
        document.getElementById("pokecoinsValue").textContent =
          data.new_pokecoins;

        closeBuyModal();

        // Show success message
        setTimeout(() => {
          alert(data.message);
        }, 300);

        // Restore and reapply filters instead of basic refresh
        const savedFilters = localStorage.getItem("pokemonFilters");
        if (savedFilters) {
          const filters = JSON.parse(savedFilters);
          fetchCards(
            filters.search || "",
            filters.types || [],
            filters.sort || "name",
            filters.order || "asc"
          );
        } else {
          fetchCards();
        }
      } else {
        closeBuyModal();
        setTimeout(() => {
          alert(data.message);
        }, 300);
      }
    })
    .catch((error) => {
      closeBuyModal();
      setTimeout(() => {
        alert("Error purchasing card");
      }, 300);
      console.error(error);
    });
}
