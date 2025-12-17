<?php
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'admin') {
    die("Error: Only admin users can delete Pokemon cards.");
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_trading";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$id = intval($_GET['id']); // Ensure id is an integer

$sql = "DELETE FROM PokemonCards WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    echo "Card deleted successfully!";
} else {
    echo "Failed to delete card.";
}

$stmt->close();
$conn->close();
?>
