<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_auth";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed.']));
}

// Get data from form
$signin_username = trim($_POST['username'] ?? '');
$signin_password = trim($_POST['password'] ?? '');

// Retrieve user data from database
$sql = "SELECT * FROM Users WHERE username=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $signin_username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if ($signin_password === $row['password']) {
        $_SESSION['username'] = $signin_username;
        $_SESSION['pokecoins'] = $row['pokecoins'];
        echo json_encode(['status' => 'success', 'username' => $signin_username, 'pokecoins' => $row['pokecoins']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid password.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No user found with that username.']);
}

$stmt->close();
$conn->close();
?>
