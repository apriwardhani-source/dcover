<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// Route: POST /auth/google
if ($method === 'POST' && $path === 'google') {
    $input = getJSONInput();
    $googleId = $input['googleId'] ?? null;
    $email = $input['email'] ?? null;
    $name = $input['name'] ?? null;
    $photoURL = $input['photoURL'] ?? null;
    
    if (!$googleId || !$email || !$name) {
        errorResponse('Missing required fields');
    }
    
    $db = getDB();
    
    // Check if user exists
    $stmt = $db->prepare('SELECT * FROM users WHERE google_id = ?');
    $stmt->bind_param('s', $googleId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    global $ADMIN_EMAILS;
    
    if (!$user) {
        // Create new user
        $role = in_array($email, $ADMIN_EMAILS) ? 'admin' : 'user';
        $stmt = $db->prepare('INSERT INTO users (google_id, email, name, photo_url, role, suspended, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())');
        $stmt->bind_param('sssss', $googleId, $email, $name, $photoURL, $role);
        $stmt->execute();
        
        $user = [
            'id' => $db->insert_id,
            'google_id' => $googleId,
            'email' => $email,
            'name' => $name,
            'photo_url' => $photoURL,
            'role' => $role,
            'suspended' => 0
        ];
    } else {
        // Update photo if changed
        if ($photoURL && $photoURL !== $user['photo_url']) {
            $stmt = $db->prepare('UPDATE users SET photo_url = ? WHERE id = ?');
            $stmt->bind_param('si', $photoURL, $user['id']);
            $stmt->execute();
            $user['photo_url'] = $photoURL;
        }
    }
    
    if ($user['suspended']) {
        errorResponse('Account suspended', 403);
    }
    
    // Generate JWT
    $token = createJWT(['userId' => $user['id'], 'email' => $user['email']]);
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'photoURL' => $user['photo_url'],
            'role' => $user['role']
        ]
    ]);
}

// Route: GET /auth/me
if ($method === 'GET' && $path === 'me') {
    $user = requireAuth();
    jsonResponse([
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'photoURL' => $user['photo_url'],
        'role' => $user['role']
    ]);
}

errorResponse('Not found', 404);
