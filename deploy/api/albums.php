<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

function formatAlbum($album) {
    return [
        'albumId' => $album['id'],
        'title' => $album['title'],
        'coverImage' => $album['cover_image'] ? '/uploads/albums/' . $album['cover_image'] : null,
        'artistName' => $album['artist_name'] ?? null,
        'userId' => $album['user_id'],
        'songCount' => (int)($album['song_count'] ?? 0),
        'createdAt' => $album['created_at']
    ];
}

// GET /albums - Get all albums
if ($method === 'GET' && $path === '') {
    $db = getDB();
    $result = $db->query("
        SELECT a.*, u.name as artist_name,
            (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
        FROM albums a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
    ");
    
    $albums = [];
    while ($row = $result->fetch_assoc()) {
        $albums[] = formatAlbum($row);
    }
    jsonResponse($albums);
}

// GET /albums/user/:userId
if ($method === 'GET' && preg_match('/^user\/(\d+)$/', $path, $matches)) {
    requireAuth();
    $userId = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT a.*, u.name as artist_name,
            (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
        FROM albums a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $albums = [];
    while ($row = $result->fetch_assoc()) {
        $albums[] = formatAlbum($row);
    }
    jsonResponse($albums);
}

// GET /albums/:id
if ($method === 'GET' && preg_match('/^(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT a.*, u.name as artist_name
        FROM albums a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $album = $stmt->get_result()->fetch_assoc();
    
    if (!$album) errorResponse('Album not found', 404);
    jsonResponse(formatAlbum($album));
}

// POST /albums - Create album
if ($method === 'POST' && $path === '') {
    $user = requireAuth();
    $title = $_POST['title'] ?? null;
    
    if (!$title) errorResponse('Album title required');
    
    $coverImage = null;
    if (isset($_FILES['cover']) && $_FILES['cover']['error'] === 0) {
        $ext = pathinfo($_FILES['cover']['name'], PATHINFO_EXTENSION);
        $coverImage = uniqid() . '-' . time() . '.' . $ext;
        $uploadPath = __DIR__ . '/../uploads/albums/' . $coverImage;
        move_uploaded_file($_FILES['cover']['tmp_name'], $uploadPath);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO albums (title, cover_image, user_id, created_at) VALUES (?, ?, ?, NOW())');
    $stmt->bind_param('ssi', $title, $coverImage, $user['id']);
    $stmt->execute();
    
    jsonResponse([
        'albumId' => $db->insert_id,
        'title' => $title,
        'coverImage' => $coverImage ? '/uploads/albums/' . $coverImage : null,
        'artistName' => $user['name'],
        'userId' => $user['id']
    ], 201);
}

// DELETE /albums/:id
if ($method === 'DELETE' && preg_match('/^(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT user_id FROM albums WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $album = $stmt->get_result()->fetch_assoc();
    
    if (!$album) errorResponse('Album not found', 404);
    if ($album['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
        errorResponse('Not authorized', 403);
    }
    
    // Check if album has songs
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM songs WHERE album_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $songs = $stmt->get_result()->fetch_assoc();
    
    if ($songs['count'] > 0) {
        errorResponse('Cannot delete album with songs');
    }
    
    $stmt = $db->prepare('DELETE FROM albums WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    jsonResponse(['success' => true]);
}

errorResponse('Not found', 404);
