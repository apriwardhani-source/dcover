<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// Helper function to format song response
function formatSong($song) {
    return [
        'songId' => $song['id'],
        'title' => $song['title'],
        'originalArtist' => $song['original_artist'],
        'coverArtist' => $song['cover_artist'] ?? null,
        'audioUrl' => '/uploads/audio/' . $song['audio_file'],
        'albumId' => $song['album_id'],
        'albumTitle' => $song['album_title'] ?? null,
        'albumCover' => $song['album_cover'] ? '/uploads/albums/' . $song['album_cover'] : null,
        'coverImage' => $song['cover_image'] ? '/uploads/covers/' . $song['cover_image'] : null,
        'likes' => (int)$song['likes'],
        'lyrics' => $song['lyrics'],
        'userId' => $song['user_id'],
        'createdAt' => $song['created_at']
    ];
}

// GET /songs - Get all songs
if ($method === 'GET' && $path === '') {
    $db = getDB();
    $result = $db->query("
        SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
        FROM songs s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN albums a ON s.album_id = a.id
        ORDER BY s.created_at DESC
    ");
    
    $songs = [];
    while ($row = $result->fetch_assoc()) {
        $songs[] = formatSong($row);
    }
    jsonResponse($songs);
}

// GET /songs/:id - Get single song
if ($method === 'GET' && preg_match('/^(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
        FROM songs s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN albums a ON s.album_id = a.id
        WHERE s.id = ?
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $song = $result->fetch_assoc();
    
    if (!$song) errorResponse('Song not found', 404);
    jsonResponse(formatSong($song));
}

// GET /songs/user/:userId
if ($method === 'GET' && preg_match('/^user\/(\d+)$/', $path, $matches)) {
    requireAuth();
    $userId = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
        FROM songs s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN albums a ON s.album_id = a.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = [];
    while ($row = $result->fetch_assoc()) {
        $songs[] = formatSong($row);
    }
    jsonResponse($songs);
}

// GET /songs/album/:albumId
if ($method === 'GET' && preg_match('/^album\/(\d+)$/', $path, $matches)) {
    $albumId = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("
        SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
        FROM songs s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN albums a ON s.album_id = a.id
        WHERE s.album_id = ?
        ORDER BY s.created_at ASC
    ");
    $stmt->bind_param('i', $albumId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $songs = [];
    while ($row = $result->fetch_assoc()) {
        $songs[] = formatSong($row);
    }
    jsonResponse($songs);
}

// POST /songs - Upload song
if ($method === 'POST' && $path === '') {
    $user = requireAuth();
    
    if (!isset($_FILES['audio'])) {
        errorResponse('Audio file required');
    }
    
    $title = $_POST['title'] ?? null;
    $originalArtist = $_POST['originalArtist'] ?? null;
    $albumId = $_POST['albumId'] ?? null;
    $lyrics = $_POST['lyrics'] ?? null;
    
    if (!$title || !$originalArtist) {
        errorResponse('Title and original artist required');
    }
    
    // Upload audio file
    $audioFile = $_FILES['audio'];
    $ext = pathinfo($audioFile['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '-' . time() . '.' . $ext;
    $uploadPath = __DIR__ . '/../uploads/audio/' . $filename;
    
    if (!move_uploaded_file($audioFile['tmp_name'], $uploadPath)) {
        errorResponse('Failed to upload file', 500);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO songs (title, original_artist, audio_file, album_id, user_id, likes, lyrics, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, NOW())');
    $stmt->bind_param('ssssis', $title, $originalArtist, $filename, $albumId, $user['id'], $lyrics);
    $stmt->execute();
    
    jsonResponse([
        'songId' => $db->insert_id,
        'title' => $title,
        'originalArtist' => $originalArtist,
        'audioUrl' => '/uploads/audio/' . $filename,
        'albumId' => $albumId,
        'userId' => $user['id']
    ], 201);
}

// POST /songs/:id/like
if ($method === 'POST' && preg_match('/^(\d+)\/like$/', $path, $matches)) {
    $user = requireAuth();
    $songId = $matches[1];
    $userId = $user['id'];
    
    $db = getDB();
    
    // Check if already liked
    $stmt = $db->prepare('SELECT * FROM song_likes WHERE song_id = ? AND user_id = ?');
    $stmt->bind_param('ii', $songId, $userId);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    
    if ($existing) {
        // Unlike
        $stmt = $db->prepare('DELETE FROM song_likes WHERE song_id = ? AND user_id = ?');
        $stmt->bind_param('ii', $songId, $userId);
        $stmt->execute();
        
        $stmt = $db->prepare('UPDATE songs SET likes = likes - 1 WHERE id = ?');
        $stmt->bind_param('i', $songId);
        $stmt->execute();
        
        jsonResponse(['liked' => false]);
    } else {
        // Like
        $stmt = $db->prepare('INSERT INTO song_likes (song_id, user_id) VALUES (?, ?)');
        $stmt->bind_param('ii', $songId, $userId);
        $stmt->execute();
        
        $stmt = $db->prepare('UPDATE songs SET likes = likes + 1 WHERE id = ?');
        $stmt->bind_param('i', $songId);
        $stmt->execute();
        
        jsonResponse(['liked' => true]);
    }
}

// GET /songs/liked/:userId
if ($method === 'GET' && preg_match('/^liked\/(\d+)$/', $path, $matches)) {
    requireAuth();
    $userId = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT song_id FROM song_likes WHERE user_id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $likes = [];
    while ($row = $result->fetch_assoc()) {
        $likes[] = $row['song_id'];
    }
    jsonResponse($likes);
}

// DELETE /songs/:id
if ($method === 'DELETE' && preg_match('/^(\d+)$/', $path, $matches)) {
    $user = requireAuth();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('SELECT user_id FROM songs WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $song = $stmt->get_result()->fetch_assoc();
    
    if (!$song) errorResponse('Song not found', 404);
    if ($song['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
        errorResponse('Not authorized', 403);
    }
    
    $stmt = $db->prepare('DELETE FROM song_likes WHERE song_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    $stmt = $db->prepare('DELETE FROM songs WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    jsonResponse(['success' => true]);
}

errorResponse('Not found', 404);
