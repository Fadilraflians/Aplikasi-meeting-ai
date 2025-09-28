<?php
/**
 * Session Management Endpoint
 * Handles session validation, refresh, and logout
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../_cors.php';

require_once '../../services/authService.php';

$authService = new AuthService();

try {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $input['action'] ?? null;

    switch ($action) {
        case 'validate':
            $token = $input['session_token'] ?? null;
            if (!$token) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'session_token required']);
                exit;
            }
            $session = $authService->validateSession($token);
            echo json_encode(['success' => (bool)$session, 'data' => $session]);
            break;

        case 'refresh':
            $refresh = $input['refresh_token'] ?? null;
            if (!$refresh) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refresh_token required']);
                exit;
            }
            $data = $authService->refreshSession($refresh);
            echo json_encode(['success' => (bool)$data, 'data' => $data]);
            break;

        case 'logout':
            $token = $input['session_token'] ?? null;
            if (!$token) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'session_token required']);
                exit;
            }
            $ok = $authService->logout($token);
            echo json_encode(['success' => (bool)$ok]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>


