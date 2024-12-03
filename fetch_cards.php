<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_trading";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$search = $_GET['search'] ?? '';  // Default to empty string
$type = $_GET['type'] ?? '';      // Default to empty string
$sort = $_GET['sort'] ?? 'name'; // Default sorting by 'name'

// Start building the query
$sql = "SELECT * FROM PokemonCards WHERE name LIKE ?";  // Search by name
$params = ['%' . $search . '%'];  // Initial parameter for search (searching by name)

// If 'type' is provided and not empty, filter by type
if (!empty($type)) {
    $sql .= " AND type = ?";  // Add condition for type
    $params[] = $type;  // Add 'type' to parameters
}

// Sorting logic
switch ($sort) {
    case 'health':
        $sql .= " ORDER BY health";
        break;
    case 'power':
        $sql .= " ORDER BY power";
        break;
    case 'type':
        $sql .= " ORDER BY type";
        break;
    case 'name':
    default:
        $sql .= " ORDER BY name";  // Default sorting by name
}

// Prepare and execute the query
$stmt = $conn->prepare($sql);

// Bind parameters dynamically
if (count($params) > 1) {
    $stmt->bind_param(str_repeat('s', count($params)), ...$params);  // Bind multiple params if 'type' is used
} else {
    $stmt->bind_param('s', $params[0]);  // Bind only the search parameter if no 'type' is provided
}

$stmt->execute();
$result = $stmt->get_result();

$cards = [];
while ($row = $result->fetch_assoc()) {
    $cards[] = $row;  // Fetch the rows into an array
}

echo json_encode($cards);  // Return the filtered results as JSON

$stmt->close();
$conn->close();
?>
