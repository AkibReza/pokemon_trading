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

  // Fetch and display cards initially
  fetchCards();
});

// Apply filters based on input values
function applyFilters() {
  const searchInput = document.getElementById("searchInput").value.trim();
  const typeFilter = document.getElementById("typeFilter").value;
  const sortOption = document.getElementById("sortOption").value;
  fetchCards(searchInput, typeFilter, sortOption);
}

// Fetch and display cards based on filters
let allCards = [];
function fetchCards(search = "", type = "", sort = "name") {
  const url = "/pokemon_trading/fetch_cards.php";
  const params = new URLSearchParams();

  if (search.trim() !== "") {
    params.append("search", search);
  }

  if (type.trim() !== "") {
    params.append("type", type);
  }

  params.append("sort", sort);

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
  container.innerHTML = "";

  if (!cards || cards.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";

  cards.forEach((card, index) => {
    const imagePath = card.image_url
      ? `images/${card.image_url}`
      : "images/default.png";

    const typeClass = card.type ? card.type.toLowerCase() : "normal";

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
        </div>
        
        <div class="card-actions">
          <button onclick="editCard(${card.id})" class="action-btn edit-btn">
            ✏️ Edit
          </button>
          <button onclick="deleteCard(${
            card.id
          })" class="action-btn delete-btn">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;

    container.appendChild(cardElement);
  });

  // Animate cards entrance with anime.js
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
