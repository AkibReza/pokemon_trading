<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to view your collection.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$servername = "localhost";
$username = "root";
$password = "";

// Connect to pokemon_trading database
$conn = new mysqli($servername, $username, $password, "pokemon_trading");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// Get user's owned cards with card details
$sql = "SELECT upc.id as ownership_id, pc.id, pc.name, pc.image_url, pc.health, pc.power, pc.type, pc.price, upc.purchased_at
        FROM UserPokemonCards upc
        JOIN PokemonCards pc ON upc.card_id = pc.id
        WHERE upc.user_id = ?
        ORDER BY upc.purchased_at DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$cards = [];
while ($row = $result->fetch_assoc()) {
    $cards[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode(['status' => 'success', 'cards' => $cards]);
?>