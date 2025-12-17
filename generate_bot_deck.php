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

// Connect to pokemon_trading database
$conn = new mysqli($servername, $username, $password, "pokemon_trading");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// Get user's deck to calculate average power
$user_deck_sql = "SELECT slot1_card_id, slot2_card_id, slot3_card_id, slot4_card_id, slot5_card_id, slot6_card_id FROM UserDecks WHERE user_id = ?";
$user_deck_stmt = $conn->prepare($user_deck_sql);
$user_deck_stmt->bind_param("i", $user_id);
$user_deck_stmt->execute();
$user_deck_result = $user_deck_stmt->get_result();
$user_deck_row = $user_deck_result->fetch_assoc();
$user_deck_stmt->close();

$card_ids = array_filter([$user_deck_row['slot1_card_id'], $user_deck_row['slot2_card_id'], $user_deck_row['slot3_card_id'], $user_deck_row['slot4_card_id'], $user_deck_row['slot5_card_id'], $user_deck_row['slot6_card_id']]);

if (count($card_ids) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'You need a complete deck to battle.']);
    exit;
}

$placeholders = str_repeat('?,', count($card_ids) - 1) . '?';
$power_sql = "SELECT pc.power FROM UserPokemonCards upc JOIN PokemonCards pc ON upc.card_id = pc.id WHERE upc.id IN ($placeholders)";
$power_stmt = $conn->prepare($power_sql);
$power_stmt->bind_param(str_repeat('i', count($card_ids)), ...$card_ids);
$power_stmt->execute();
$power_result = $power_stmt->get_result();

$powers = [];
while ($row = $power_result->fetch_assoc()) {
    $powers[] = $row['power'];
}
$power_stmt->close();

$avg_power = array_sum($powers) / count($powers);

// Select 6 unique cards with power close to avg_power
$min_power = $avg_power - 10;
$max_power = $avg_power + 10;

$cards_sql = "SELECT id, name, image_url, health, power, type FROM PokemonCards WHERE power BETWEEN ? AND ? ORDER BY RAND() LIMIT 6";
$cards_stmt = $conn->prepare($cards_sql);
$cards_stmt->bind_param("ii", $min_power, $max_power);
$cards_stmt->execute();
$cards_result = $cards_stmt->get_result();

$bot_deck = [];
while ($card = $cards_result->fetch_assoc()) {
    $bot_deck[] = $card;
}
$cards_stmt->close();

// If not enough cards, select more randomly
if (count($bot_deck) < 6) {
    $needed = 6 - count($bot_deck);
    $exclude_ids = array_column($bot_deck, 'id');
    $exclude_list = implode(',', $exclude_ids);
    $extra_sql = "SELECT id, name, image_url, health, power, type FROM PokemonCards";
    if (!empty($exclude_ids)) {
        $extra_sql .= " WHERE id NOT IN ($exclude_list)";
    }
    $extra_sql .= " ORDER BY RAND() LIMIT $needed";
    $extra_result = $conn->query($extra_sql);
    while ($card = $extra_result->fetch_assoc()) {
        $bot_deck[] = $card;
    }
}

$conn->close();

echo json_encode(['status' => 'success', 'bot_deck' => $bot_deck]);
?>