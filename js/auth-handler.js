// Tab switching functionality
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  if (mode === "signup") {
    switchTab("signup");
  } else {
    switchTab("signin");
  }

  // Add tab click listeners
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.getAttribute("data-tab");
      switchTab(tab);
    });
  });
});

function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

  // Update form containers
  document.querySelectorAll(".form-container").forEach((container) => {
    container.classList.remove("active");
  });
  document.getElementById(`${tab}-container`).classList.add("active");
}

document.getElementById("signUpForm").addEventListener("submit", function (e) {
  e.preventDefault();
  handleSignUp();
});

function handleSignUp() {
  const username = document.querySelector("#signup-username").value.trim();
  const password = document.querySelector("#signup-password").value.trim();
  const errorElement = document.querySelector("#signup-error");
  const messageElement = document.querySelector("#signupMessage");

  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username.match(usernameRegex)) {
    errorElement.textContent =
      "Username cannot contain spaces or special characters.";
    messageElement.textContent = "";
    return;
  }

  if (password.length < 5) {
    errorElement.textContent = "Password must be at least 5 characters.";
    messageElement.textContent = "";
    return;
  }

  errorElement.textContent = "";

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  fetch("signup.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((data) => {
      messageElement.textContent = data;
      errorElement.textContent = "";
      // Clear form after successful signup
      document.getElementById("signUpForm").reset();
      // Switch to sign in tab after 2 seconds
      setTimeout(() => {
        switchTab("signin");
      }, 2000);
    })
    .catch(() => {
      errorElement.textContent = "Error: Unable to process request.";
      messageElement.textContent = "";
    });
}

document.getElementById("signInForm").addEventListener("submit", function (e) {
  e.preventDefault();
  handleSignIn();
});

function handleSignIn() {
  const username = document.querySelector("#signin-username").value.trim();
  const password = document.querySelector("#signin-password").value.trim();
  const errorElement = document.querySelector("#signin-error");

  if (!username || !password) {
    errorElement.textContent = "Please enter both username and password.";
    return;
  }

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  fetch("signin.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        localStorage.setItem("username", data.username);
        localStorage.setItem("pokecoins", data.pokecoins);
        localStorage.setItem("role", data.role);
        window.location.href = "display.html"; // Redirect to display page
      } else {
        errorElement.textContent = data.message;
      }
    })
    .catch(() => {
      errorElement.textContent = "Error: Unable to process request.";
    });
}
