function submitForm() {
  const form = document.getElementById("cardForm");
  const responseMessage = document.getElementById("responseMessage");

  // Get values from the form
  const name = form.name.value.trim();
  const image_url = form.image_url.value.trim();
  const health = form.health.value.trim();
  const power = form.power.value.trim();
  const type = form.type.value.trim();

  // Validate fields
  if (!name || !health || !power || !type) {
    responseMessage.innerHTML = "<p>Please fill in all required fields.</p>";
    responseMessage.style.color = "red";
    return; // Stop the form submission
  }

  // Create FormData object
  const formData = new FormData(form);

  // Send the data to the server
  fetch("insert.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((data) => {
      responseMessage.innerHTML = `<p>${data}</p>`;
      responseMessage.style.color = "green";
      form.reset();
    })
    .catch(() => {
      responseMessage.innerHTML = "<p>Submission failed. Please try again.</p>";
      responseMessage.style.color = "red";
    });
}
