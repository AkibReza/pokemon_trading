document.getElementById("signUpForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent default form submission
  handleSignUp();
});

function handleSignUp() {
  const username = document.querySelector("#signup-username").value.trim();
  const password = document.querySelector("#signup-password").value.trim();
  const errorElement = document.querySelector("#signup-error");

  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username.match(usernameRegex)) {
    errorElement.textContent =
      "Username cannot contain spaces or special characters.";
    return;
  }

  if (password.length < 8) {
    errorElement.textContent = "Password must be at least 8 characters.";
    return;
  }

  errorElement.textContent = "";

  // Submit the form data using fetch
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  fetch("signup.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((data) => {
      const signupMessage = document.getElementById("signupMessage");
      signupMessage.innerHTML = data;
      signupMessage.style.color = "green";
    })
    .catch(() => {
      errorElement.textContent = "Error: Unable to process request.";
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
        window.location.href = "index.html"; // Redirect to index.html after successful sign-in
      } else {
        errorElement.textContent = data.message;
      }
    })
    .catch(() => {
      errorElement.textContent = "Error: Unable to process request.";
    });
}
