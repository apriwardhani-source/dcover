<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// GET /users - Get all users (admin only)
if ($method === 'GET' && $path === '') {
    requireAdmin();
    $db = getDB();
    $result = $db->query('SELECT id, name, email, photo_url, role, suspended, created_at FROM users ORDER BY created_at DESC');
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'photoURL' => $row['photo_url'],
            'role' => $row['role'],
            'suspended' => (bool)$row['suspended'],
            'createdAt' => $row['created_at']
        ];
    }
    jsonResponse($users);
}

// GET /users/:id
if ($method === 'GET' && preg_match('/^(\d+)$/', $path, $matches)) {
    requireAuth();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, email, photo_url, role, created_at FROM users WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if (!$user) errorResponse('User not found', 404);
    
    // Get stats
    $stmt = $db->prepare('SELECT COUNT(*) as songCount, COALESCE(SUM(likes), 0) as totalLikes FROM songs WHERE user_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();
    
    $stmt = $db->prepare('SELECT COUNT(*) as albumCount FROM albums WHERE user_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $albumStats = $stmt->get_result()->fetch_assoc();
    
    jsonResponse([
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'photoURL' => $user['photo_url'],
        'role' => $user['role'],
        'createdAt' => $user['created_at'],
        'songCount' => (int)$stats['songCount'],
        'albumCount' => (int)$albumStats['albumCount'],
        'totalLikes' => (int)$stats['totalLikes']
    ]);
}

// PATCH /users/:id/suspend
if ($method === 'PATCH' && preg_match('/^(\d+)\/suspend$/', $path, $matches)) {
    $admin = requireAdmin();
    $id = $matches[1];
    $input = getJSONInput();
    $suspended = $input['suspended'] ?? false;
    
    $db = getDB();
    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if (!$user) errorResponse('User not found', 404);
    if ($user['role'] === 'admin') errorResponse('Cannot suspend admin', 403);
    
    $stmt = $db->prepare('UPDATE users SET suspended = ? WHERE id = ?');
    $suspendedInt = $suspended ? 1 : 0;
    $stmt->bind_param('ii', $suspendedInt, $id);
    $stmt->execute();
    
    jsonResponse(['success' => true, 'suspended' => $suspended]);
}

// PATCH /users/:id/role
if ($method === 'PATCH' && preg_match('/^(\d+)\/role$/', $path, $matches)) {
    $admin = requireAdmin();
    $id = $matches[1];
    $input = getJSONInput();
    $role = $input['role'] ?? '';
    
    if (!in_array($role, ['user', 'admin'])) {
        errorResponse('Invalid role');
    }
    
    if ((int)$id === $admin['id']) {
        errorResponse('Cannot change your own role', 403);
    }
    
    $db = getDB();
    $stmt = $db->prepare('UPDATE users SET role = ? WHERE id = ?');
    $stmt->bind_param('si', $role, $id);
    $stmt->execute();
    
    jsonResponse(['success' => true, 'role' => $role]);
}

// PATCH /users/profile
if ($method === 'PATCH' && $path === 'profile') {
    $user = requireAuth();
    $input = getJSONInput();
    $name = $input['name'] ?? '';
    $bio = $input['bio'] ?? null;
    
    if (empty(trim($name))) {
        errorResponse('Name is required');
    }
    
    $db = getDB();
    $stmt = $db->prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?');
    $nameTrim = trim($name);
    $stmt->bind_param('ssi', $nameTrim, $bio, $user['id']);
    $stmt->execute();
    
    jsonResponse(['success' => true, 'name' => $nameTrim, 'bio' => $bio]);
}

errorResponse('Not found', 404);
