<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_auth";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get data from form
$signup_username = trim($_POST['username'] ?? '');
$signup_password = trim($_POST['password'] ?? '');

// Validate input
if (!preg_match('/^[a-zA-Z0-9_]+$/', $signup_username)) {
    die("Error: Username can only contain letters, numbers, and underscores.");
}

if (strlen($signup_password) < 8) {
    die("Error: Password must be at least 8 characters long.");
}

// Check for duplicate usernames
$check_sql = "SELECT * FROM Users WHERE username=?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param("s", $signup_username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    die("Error: Username is already taken. Please choose another.");
}
$stmt->close();

// Insert into database
$insert_sql = "INSERT INTO Users (username, password, pokecoins) VALUES (?, ?, 100)";
$stmt = $conn->prepare($insert_sql);
$stmt->bind_param("ss", $signup_username, $signup_password);

if ($stmt->execute()) {
    echo "New user created successfully. You can now <a href='authenticate.html?action=signin'>Sign In</a>";
} else {
    echo "Error: Could not create user. Please try again later.";
}

$stmt->close();
$conn->close();
?>
