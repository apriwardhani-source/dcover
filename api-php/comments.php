<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// GET /comments/song/:songId
if ($method === 'GET' && preg_match('/^song\/(\d+)$/', $path, $matches)) {
    $songId = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT c.*, u.name as user_name, u.photo_url as user_photo
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.song_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->bind_param('i', $songId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = [
            'id' => $row['id'],
            'content' => $row['content'],
            'songId' => $row['song_id'],
            'userId' => $row['user_id'],
            'userName' => $row['user_name'],
            'userPhoto' => $row['user_photo'],
            'createdAt' => $row['created_at']
        ];
    }
    jsonResponse($comments);
}

// POST /comments - Add comment
if ($method === 'POST' && $path === '') {
    $user = requireAuth();
    $input = getJSONInput();
    $songId = $input['songId'] ?? null;
    $content = $input['content'] ?? '';
    
    if (!$songId || empty(trim($content))) {
        errorResponse('Song ID and content required');
    }
    
    $db = getDB();
    $contentTrim = trim($content);
    $stmt = $db->prepare('INSERT INTO comments (song_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())');
    $stmt->bind_param('iis', $songId, $user['id'], $contentTrim);
    $stmt->execute();
    
    jsonResponse([
        'id' => $db->insert_id,
        'content' => $contentTrim,
        'songId' => $songId,
        'userId' => $user['id'],
        'userName' => $user['name'],
        'userPhoto' => $user['photo_url'],
        'createdAt' => date('Y-m-d H:i:s')
    ], 201);
}

// DELETE /comments/:id
if ($method === 'DELETE' && preg_match('/^(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT user_id FROM comments WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $comment = $stmt->get_result()->fetch_assoc();
    
    if (!$comment) errorResponse('Comment not found', 404);
    if ($comment['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
        errorResponse('Not authorized', 403);
    }
    
    $stmt = $db->prepare('DELETE FROM comments WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    jsonResponse(['success' => true]);
}

errorResponse('Not found', 404);
