<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['route'] ?? '';

// GET /banners - Get active banners
if ($method === 'GET' && $path === '') {
    $db = getDB();
    $result = $db->query("SELECT * FROM banners WHERE is_active = 1 ORDER BY created_at DESC");
    
    $banners = [];
    while ($row = $result->fetch_assoc()) {
        $banners[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'imageUrl' => '/uploads/banners/' . $row['image'],
            'link' => $row['link'],
            'isActive' => (bool)$row['is_active'],
            'createdAt' => $row['created_at']
        ];
    }
    jsonResponse($banners);
}

// GET /banners/all - Get all banners (admin)
if ($method === 'GET' && $path === 'all') {
    requireAdmin();
    $db = getDB();
    $result = $db->query("SELECT * FROM banners ORDER BY created_at DESC");
    
    $banners = [];
    while ($row = $result->fetch_assoc()) {
        $banners[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'imageUrl' => '/uploads/banners/' . $row['image'],
            'link' => $row['link'],
            'isActive' => (bool)$row['is_active'],
            'createdAt' => $row['created_at']
        ];
    }
    jsonResponse($banners);
}

// POST /banners - Create banner
if ($method === 'POST' && $path === '') {
    requireAdmin();
    $title = $_POST['title'] ?? '';
    $link = $_POST['link'] ?? null;
    
    if (!isset($_FILES['image'])) {
        errorResponse('Image required');
    }
    
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '-' . time() . '.' . $ext;
    $uploadPath = __DIR__ . '/../uploads/banners/' . $filename;
    
    if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
        errorResponse('Failed to upload image', 500);
    }
    
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO banners (title, image, link, is_active, created_at) VALUES (?, ?, ?, 1, NOW())');
    $stmt->bind_param('sss', $title, $filename, $link);
    $stmt->execute();
    
    jsonResponse([
        'id' => $db->insert_id,
        'title' => $title,
        'imageUrl' => '/uploads/banners/' . $filename,
        'link' => $link,
        'isActive' => true
    ], 201);
}

// PATCH /banners/:id/toggle - Toggle active status
if ($method === 'PATCH' && preg_match('/^(\d+)\/toggle$/', $path, $matches)) {
    requireAdmin();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('UPDATE banners SET is_active = NOT is_active WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    $stmt = $db->prepare('SELECT is_active FROM banners WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    jsonResponse(['isActive' => (bool)$result['is_active']]);
}

// DELETE /banners/:id
if ($method === 'DELETE' && preg_match('/^(\d+)$/', $path, $matches)) {
    requireAdmin();
    $id = $matches[1];
    
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM banners WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    jsonResponse(['success' => true]);
}

errorResponse('Not found', 404);
