<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$servername = "localhost";
$username = "root";
$password = "";

// Get amount from request
$data = json_decode(file_get_contents("php://input"), true);
$amount = intval($data['amount']);

// Connect to pokemon_auth database
$conn_auth = new mysqli($servername, $username, $password, "pokemon_auth");
if ($conn_auth->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// Get user's current pokecoins
$stmt = $conn_auth->prepare("SELECT pokecoins FROM Users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$current_pokecoins = $user['pokecoins'];
$stmt->close();

// Add pokecoins
$new_pokecoins = $current_pokecoins + $amount;
$stmt = $conn_auth->prepare("UPDATE Users SET pokecoins = ? WHERE id = ?");
$stmt->bind_param("ii", $new_pokecoins, $user_id);
$stmt->execute();
$stmt->close();

// Update session
$_SESSION['pokecoins'] = $new_pokecoins;

$conn_auth->close();

echo json_encode([
    'status' => 'success',
    'new_pokecoins' => $new_pokecoins
]);
?>