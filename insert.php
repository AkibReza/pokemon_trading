<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_trading"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get data from form
$name = $_POST['name'];
$image_url = $_POST['image_url'];
$health = $_POST['health'];
$power = $_POST['power'];
$type = $_POST['type'];

// Prepare and bind
$sql = $conn->prepare("INSERT INTO PokemonCards (name, image_url, health, power, type) VALUES (?, ?, ?, ?, ?)");
$sql->bind_param("ssiis", $name, $image_url, $health, $power, $type);  // Change to "ssiis" (two strings, two integers, one string)

if ($sql->execute()) {
    echo "New card added successfully!";
} else {
    echo "Error: " . $sql->error;
}

$conn->close();
?>
