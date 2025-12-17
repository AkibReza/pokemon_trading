<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to view your deck.']);
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

// Get or create user's deck
$sql = "SELECT * FROM UserDecks WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$deck = null;
if ($result->num_rows > 0) {
    $deck = $result->fetch_assoc();
} else {
    // Create new deck for user
    $insert_sql = "INSERT INTO UserDecks (user_id) VALUES (?)";
    $insert_stmt = $conn->prepare($insert_sql);
    $insert_stmt->bind_param("i", $user_id);
    $insert_stmt->execute();
    $insert_stmt->close();

    // Fetch the newly created deck
    $stmt->execute();
    $result = $stmt->get_result();
    $deck = $result->fetch_assoc();
}

$stmt->close();

// Get card details for each slot
$slots = [];
for ($i = 1; $i <= 6; $i++) {
    $slot_key = "slot{$i}_card_id";
    $slots[$i] = null;

    if ($deck[$slot_key]) {
        $card_sql = "SELECT pc.id, pc.name, pc.image_url, pc.health, pc.power, pc.type, pc.price, upc.id as ownership_id
                     FROM UserPokemonCards upc
                     JOIN PokemonCards pc ON upc.card_id = pc.id
                     WHERE upc.id = ?";
        $card_stmt = $conn->prepare($card_sql);
        $card_stmt->bind_param("i", $deck[$slot_key]);
        $card_stmt->execute();
        $card_result = $card_stmt->get_result();

        if ($card_result->num_rows > 0) {
            $card_data = $card_result->fetch_assoc();
            $slots[$i] = $card_data;
        }
        $card_stmt->close();
    }
}

$conn->close();

echo json_encode(['status' => 'success', 'deck' => $slots]);
?>