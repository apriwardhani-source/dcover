<?php
// Main API Router - Routes requests to appropriate handlers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';

// Parse the URL
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace($basePath, '', $path);
$path = trim($path, '/');

// Route to appropriate handler
$segments = explode('/', $path);
$endpoint = $segments[0] ?? '';
$route = implode('/', array_slice($segments, 1));

// Set route for sub-handlers
$_GET['route'] = $route;

switch ($endpoint) {
    case 'auth':
        require __DIR__ . '/auth.php';
        break;
    case 'songs':
        require __DIR__ . '/songs.php';
        break;
    case 'albums':
        require __DIR__ . '/albums.php';
        break;
    case 'users':
        require __DIR__ . '/users.php';
        break;
    case 'comments':
        require __DIR__ . '/comments.php';
        break;
    case 'follows':
        require __DIR__ . '/follows.php';
        break;
    case 'banners':
        require __DIR__ . '/banners.php';
        break;
    case 'health':
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok', 'message' => 'dcover PHP API is running']);
        break;
    default:
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
}
