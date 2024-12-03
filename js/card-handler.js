document.addEventListener("DOMContentLoaded", function () {
  // Event listener for Apply Filters button
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyFilters); // Attach event handler
  } else {
    console.log("Apply Filters button not found");
  }

  // Fetch and display cards initially (if needed)
  fetchCards();
});

// Apply filters based on input values
function applyFilters() {
  const searchInput = document.getElementById("searchInput").value.trim();
  const typeFilter = document.getElementById("typeFilter").value;
  const sortOption = document.getElementById("sortOption").value;
  console.log("Filters applied: ", searchInput, typeFilter, sortOption); // Log values to check
  fetchCards(searchInput, typeFilter, sortOption);
}

// Fetch and display cards based on filters
let allCards = [];
function fetchCards(search = "", type = "", sort = "name") {
  const url = "/pokemon_trading/fetch_cards.php";
  const params = new URLSearchParams();

  // Append search filter if provided
  if (search.trim() !== "") {
    params.append("search", search);
  }

  // Append type filter if selected
  if (type.trim() !== "") {
    params.append("type", type);
  }

  // Append sort option
  params.append("sort", sort);

  // Log the request URL to make sure parameters are sent correctly
  console.log("Fetch Request URL:", url + "?" + params.toString());

  // Send the fetch request with query parameters
  fetch(url + "?" + params.toString())
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetch Success:", data);
      allCards = data;
      displayCards(allCards); // Display the cards in the table
    })
    .catch((error) => {
      console.error("Fetch Error:", error);
      document.getElementById("cardContainer").innerHTML =
        '<tr><td colspan="6">Error fetching cards.</td></tr>';
    });
}

function displayCards(cards) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = ""; // Clear previous content

  if (!cards || cards.length === 0) {
    container.innerHTML = '<tr><td colspan="6">No cards available.</td></tr>';
    return;
  }

  cards.forEach((card) => {
    const imagePath = card.image_url
      ? `images/${card.image_url}`
      : "images/default.png"; // Default image
    container.innerHTML += `
      <tr>
        <td><img src="${imagePath}" alt="${
      card.name
    }" class="pokemon-image"></td>
        <td>${card.name || "Unknown"}</td>
        <td>${card.type || "Unknown"}</td>
        <td>${card.health || "0"}</td>
        <td>${card.power || "0"}</td>
        <td>
          <button onclick="editCard(${card.id})">Edit</button>
          <button onclick="deleteCard(${card.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function deleteCard(cardId) {
  if (confirm("Are you sure you want to delete this card?")) {
    fetch(`delete_card.php?id=${cardId}`, { method: "POST" })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
        allCards = allCards.filter((card) => card.id !== cardId);
        displayCards(allCards);
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

  document.getElementById("editModal").style.display = "block";
}

document.querySelector(".close").onclick = function () {
  document.getElementById("editModal").style.display = "none";
};

window.onclick = function (event) {
  if (event.target === document.getElementById("editModal")) {
    document.getElementById("editModal").style.display = "none";
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
      alert(data);
      allCards = allCards.map((card) =>
        card.id === parseInt(id) ? updatedCard : card
      );
      displayCards(allCards);
      document.getElementById("editModal").style.display = "none";
    });
}
