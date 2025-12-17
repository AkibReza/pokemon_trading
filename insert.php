<?php
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'admin') {
    die("Error: Only admin users can add Pokemon cards.");
}

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
$health = $_POST['health'];
$power = $_POST['power'];
$type = $_POST['type'];
$price = $_POST['price'];
$image_url = '';

// Handle image upload
if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] == 0) {
    $allowed_types = array('jpg', 'jpeg', 'png', 'gif');
    $file_name = $_FILES['image_file']['name'];
    $file_size = $_FILES['image_file']['size'];
    $file_tmp = $_FILES['image_file']['tmp_name'];
    $file_type = $_FILES['image_file']['type'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    
    // Validate file extension
    if (!in_array($file_ext, $allowed_types)) {
        die("Error: Only JPG, JPEG, PNG & GIF files are allowed.");
    }
    
    // Validate file size (5MB max)
    if ($file_size > 5242880) {
        die("Error: File size must be less than 5MB.");
    }
    
    // Create unique filename to avoid conflicts
    $new_filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $file_name);
    $upload_path = 'images/' . $new_filename;
    
    // Move uploaded file to images folder
    if (move_uploaded_file($file_tmp, $upload_path)) {
        $image_url = $new_filename;
    } else {
        die("Error: Failed to upload image.");
    }
}

// Prepare and bind
$sql = $conn->prepare("INSERT INTO PokemonCards (name, image_url, health, power, type, price) VALUES (?, ?, ?, ?, ?, ?)");
$sql->bind_param("ssiisi", $name, $image_url, $health, $power, $type, $price);

if ($sql->execute()) {
    echo "New card added successfully!";
} else {
    echo "Error: " . $sql->error;
}

$conn->close();
?>