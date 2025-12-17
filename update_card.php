<?php
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'admin') {
    die("Error: Only admin users can update Pokemon cards.");
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_trading";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];
$name = $data['name'];
$health = $data['health'];
$power = $data['power'];
$type = $data['type'];
$price = $data['price'];

$sql = "UPDATE PokemonCards SET name=?, health=?, power=?, type=?, price=? WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('siisii', $name, $health, $power, $type, $price, $id);

if ($stmt->execute()) {
    echo "Card updated successfully!";
} else {
    echo "Failed to update card.";
}

$stmt->close();
$conn->close();
?>
