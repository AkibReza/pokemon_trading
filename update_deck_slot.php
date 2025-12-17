<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to manage your deck.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);
$slot = intval($data['slot']);
$ownership_id = isset($data['ownership_id']) ? intval($data['ownership_id']) : null;

if ($slot < 1 || $slot > 6) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid slot number.']);
    exit;
}

$servername = "localhost";
$username = "root";
$password = "";

// Connect to pokemon_trading database
$conn = new mysqli($servername, $username, $password, "pokemon_trading");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// Verify that the ownership_id belongs to the user (if provided)
if ($ownership_id) {
    $verify_sql = "SELECT id FROM UserPokemonCards WHERE id = ? AND user_id = ?";
    $verify_stmt = $conn->prepare($verify_sql);
    $verify_stmt->bind_param("ii", $ownership_id, $user_id);
    $verify_stmt->execute();
    $verify_result = $verify_stmt->get_result();

    if ($verify_result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'You do not own this card.']);
        $verify_stmt->close();
        $conn->close();
        exit;
    }
    $verify_stmt->close();
}

// Get or create user's deck
$sql = "SELECT id FROM UserDecks WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Create new deck for user
    $insert_sql = "INSERT INTO UserDecks (user_id) VALUES (?)";
    $insert_stmt = $conn->prepare($insert_sql);
    $insert_stmt->bind_param("i", $user_id);
    $insert_stmt->execute();
    $deck_id = $conn->insert_id;
    $insert_stmt->close();
} else {
    $deck = $result->fetch_assoc();
    $deck_id = $deck['id'];
}

$stmt->close();

// Update the slot
$slot_column = "slot{$slot}_card_id";
$update_sql = "UPDATE UserDecks SET $slot_column = ? WHERE id = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("ii", $ownership_id, $deck_id);
$update_stmt->execute();

if ($update_stmt->affected_rows >= 0) {
    echo json_encode(['status' => 'success', 'message' => 'Deck updated successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update deck.']);
}

$update_stmt->close();
$conn->close();
?>