<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// POST /follows/:userId - Follow user
if ($method === 'POST' && preg_match('/^(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $followingId = $matches[1];
    
    if ($user['id'] == $followingId) {
        errorResponse('Cannot follow yourself');
    }
    
    $db = getDB();
    
    // Check if already following
    $stmt = $db->prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?');
    $stmt->bind_param('ii', $user['id'], $followingId);
    $stmt->execute();
    
    if ($stmt->get_result()->fetch_assoc()) {
        errorResponse('Already following');
    }
    
    $stmt = $db->prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, NOW())');
    $stmt->bind_param('ii', $user['id'], $followingId);
    $stmt->execute();
    
    jsonResponse(['success' => true, 'following' => true]);
}

// DELETE /follows/:userId - Unfollow user
if ($method === 'DELETE' && preg_match('/^(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $followingId = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?');
    $stmt->bind_param('ii', $user['id'], $followingId);
    $stmt->execute();
    
    jsonResponse(['success' => true, 'following' => false]);
}

// GET /follows/check/:userId - Check if following
if ($method === 'GET' && preg_match('/^check\/(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $followingId = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?');
    $stmt->bind_param('ii', $user['id'], $followingId);
    $stmt->execute();
    
    $isFollowing = $stmt->get_result()->fetch_assoc() !== null;
    jsonResponse(['following' => $isFollowing]);
}

// GET /follows/followers/:userId - Get followers count
if ($method === 'GET' && preg_match('/^followers\/(\d+)$/', $path, $matches)) {
    $userId = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    jsonResponse(['count' => (int)$result['count']]);
}

// GET /follows/following/:userId - Get following count
if ($method === 'GET' && preg_match('/^following\/(\d+)$/', $path, $matches)) {
    $userId = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    jsonResponse(['count' => (int)$result['count']]);
}

errorResponse('Not found', 404);
