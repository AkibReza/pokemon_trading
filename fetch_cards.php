<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pokemon_trading";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$search = $_GET['search'] ?? '';
$types = isset($_GET['types']) ? json_decode($_GET['types'], true) : [];
$sort = $_GET['sort'] ?? 'name';
$order = $_GET['order'] ?? 'asc';

// Start building the query
$sql = "SELECT * FROM PokemonCards WHERE name LIKE ?";
$params = ['%' . $search . '%'];
$paramTypes = 's';

// Handle multiple types filter
if (!empty($types) && is_array($types)) {
    $placeholders = implode(',', array_fill(0, count($types), '?'));
    $sql .= " AND type IN ($placeholders)";
    foreach ($types as $type) {
        $params[] = $type;
        $paramTypes .= 's';
    }
}

// Sorting logic
$validSorts = ['name', 'health', 'power', 'type', 'price'];
$validOrders = ['asc', 'desc'];

$sortColumn = in_array($sort, $validSorts) ? $sort : 'name';
$sortOrder = in_array(strtolower($order), $validOrders) ? strtoupper($order) : 'ASC';

$sql .= " ORDER BY $sortColumn $sortOrder";

// Prepare and execute the query
$stmt = $conn->prepare($sql);

// Bind parameters dynamically
if (count($params) > 0) {
    $stmt->bind_param($paramTypes, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$cards = [];
while ($row = $result->fetch_assoc()) {
    $cards[] = $row;
}

echo json_encode($cards);

$stmt->close();
$conn->close();
?>
