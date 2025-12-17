<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is a player
if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'You must be logged in to purchase cards.']);
    exit;
}

if ($_SESSION['role'] !== 'player') {
    echo json_encode(['status' => 'error', 'message' => 'Only players can purchase cards.']);
    exit;
}

$servername = "localhost";
$username = "root";
$password = "";

// Get card ID from request
$data = json_decode(file_get_contents("php://input"), true);
$card_id = intval($data['card_id']);
$user_id = $_SESSION['user_id'];

// Connect to pokemon_trading database to get card details
$conn_trading = new mysqli($servername, $username, $password, "pokemon_trading");
if ($conn_trading->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// Get card price
$stmt = $conn_trading->prepare("SELECT price, name FROM PokemonCards WHERE id = ?");
$stmt->bind_param("i", $card_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Card not found.']);
    $stmt->close();
    $conn_trading->close();
    exit;
}

$card = $result->fetch_assoc();
$card_price = $card['price'];
$card_name = $card['name'];
$stmt->close();

// Connect to pokemon_auth database to check user's pokecoins
$conn_auth = new mysqli($servername, $username, $password, "pokemon_auth");
if ($conn_auth->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    $conn_trading->close();
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

// Check if user has enough pokecoins
if ($current_pokecoins < $card_price) {
    echo json_encode(['status' => 'error', 'message' => 'Insufficient PokeCoins. You need ' . $card_price . ' but only have ' . $current_pokecoins . '.']);
    $conn_auth->close();
    $conn_trading->close();
    exit;
}

// Check if user already owns this card
$stmt = $conn_trading->prepare("SELECT id FROM UserPokemonCards WHERE user_id = ? AND card_id = ?");
$stmt->bind_param("ii", $user_id, $card_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'You already own this card!']);
    $stmt->close();
    $conn_auth->close();
    $conn_trading->close();
    exit;
}
$stmt->close();

// Start transaction
$conn_auth->begin_transaction();
$conn_trading->begin_transaction();

try {
    // Deduct pokecoins from user
    $new_pokecoins = $current_pokecoins - $card_price;
    $stmt = $conn_auth->prepare("UPDATE Users SET pokecoins = ? WHERE id = ?");
    $stmt->bind_param("ii", $new_pokecoins, $user_id);
    $stmt->execute();
    $stmt->close();

    // Add card to user's collection
    $stmt = $conn_trading->prepare("INSERT INTO UserPokemonCards (user_id, card_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $user_id, $card_id);
    $stmt->execute();
    $stmt->close();

    // Commit transactions
    $conn_auth->commit();
    $conn_trading->commit();

    // Update session
    $_SESSION['pokecoins'] = $new_pokecoins;

    echo json_encode([
        'status' => 'success', 
        'message' => 'Successfully purchased ' . $card_name . '!',
        'new_pokecoins' => $new_pokecoins
    ]);

} catch (Exception $e) {
    // Rollback on error
    $conn_auth->rollback();
    $conn_trading->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Purchase failed. Please try again.']);
}

$conn_auth->close();
$conn_trading->close();
?>
