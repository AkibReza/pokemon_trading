function submitForm() {
  // Check authentication
  const username = localStorage.getItem("username");
  if (!username) {
    window.location.href = "landing.html";
    return;
  }

  const form = document.getElementById("cardForm");
  const responseMessage = document.getElementById("responseMessage");

  // Get values from the form
  const name = form.name.value.trim();
  const health = form.health.value.trim();
  const power = form.power.value.trim();
  const type = form.type.value.trim();

  // Validate required fields
  if (!name || !health || !power || !type) {
    responseMessage.innerHTML = "⚠️ Please fill in all required fields.";
    responseMessage.className = "response-message error";
    return;
  }

  // Create FormData object
  const formData = new FormData();
  formData.append("name", name);
  formData.append("health", health);
  formData.append("power", power);
  formData.append("type", type);

  // Add image file if selected
  const imageFile = document.getElementById("image_file").files[0];
  if (imageFile) {
    // Validate file size (5MB max)
    if (imageFile.size > 5 * 1024 * 1024) {
      responseMessage.innerHTML =
        "❌ Image file is too large. Maximum size is 5MB.";
      responseMessage.className = "response-message error";
      return;
    }
    formData.append("image_file", imageFile);
  }

  // Show loading state
  responseMessage.innerHTML = "⏳ Adding Pokémon...";
  responseMessage.className = "response-message loading";

  // Send the data to the server
  fetch("insert.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((data) => {
      responseMessage.innerHTML = `✅ ${data}`;
      responseMessage.className = "response-message success";
      form.reset();

      // Redirect to display page after 2 seconds
      setTimeout(() => {
        window.location.href = "display.html";
      }, 2000);
    })
    .catch(() => {
      responseMessage.innerHTML = "❌ Submission failed. Please try again.";
      responseMessage.className = "response-message error";
    });
}
