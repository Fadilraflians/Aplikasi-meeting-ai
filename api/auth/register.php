<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../_cors.php';
require_once __DIR__ . '/../../backend/config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Support both action-based and direct registration
    $action = $input['action'] ?? null;
    
    // If action is provided, validate it
    if ($action && $action !== 'register') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
    }

    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $full_name = trim($input['full_name'] ?? $username);

    if ($username === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'username, email and password are required']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }

    $database = new Database();
    $pdo = $database->getConnection();
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }

    // Check if username or email already exists
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
    $check->execute([$username, $email]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        exit;
    }

    // Store password as plain text (as requested)
    $sql = "INSERT INTO users (username, email, password, full_name, is_active, login_count, created_at, updated_at)
            VALUES (:username, :email, :password, :full_name, 1, 0, NOW(), NOW())";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':password' => $password,
        ':full_name' => $full_name
    ]);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create user']);
        exit;
    }

    $userId = (int)$pdo->lastInsertId();

    // Get created user data
    $userStmt = $pdo->prepare("SELECT id, username, email, full_name, created_at FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user' => $userData
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>

