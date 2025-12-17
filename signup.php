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

if (strlen($signup_password) < 5) {
    die("Error: Password must be at least 5 characters long.");
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

// Insert into database with default player role and 1000 PokeCoins
try {
    $insert_sql = "INSERT INTO Users (username, password, role, pokecoins) VALUES (?, ?, 'player', 1000)";
    $stmt = $conn->prepare($insert_sql);
    $stmt->bind_param("ss", $signup_username, $signup_password);

    if ($stmt->execute()) {
        echo "New user created successfully. You can now <a href='authenticate.html?action=signin'>Sign In</a>";
    } else {
        echo "Error: Could not create user. Please try again later.";
    }
    $stmt->close();

} catch (mysqli_sql_exception $e) {
    // Fallback for older schema without `role` column — try inserting with pokecoins only
    try {
        $insert_sql = "INSERT INTO Users (username, password, pokecoins) VALUES (?, ?, 1000)";
        $stmt = $conn->prepare($insert_sql);
        $stmt->bind_param("ss", $signup_username, $signup_password);

        if ($stmt->execute()) {
            echo "New user created successfully. You can now <a href='authenticate.html?action=signin'>Sign In</a>";
        } else {
            echo "Error: Could not create user. Please try again later.";
        }
        $stmt->close();

    } catch (Exception $e2) {
        // If both attempts fail, instruct the user to update the database schema
        echo "Error: Database schema mismatch. Please import/update the database using data.sql.";
    }
}

$conn->close();

$stmt->close();
$conn->close();
?>
