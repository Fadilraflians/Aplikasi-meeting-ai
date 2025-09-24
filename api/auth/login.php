<?php
/**
 * Regular Authentication Endpoint
 * Handles email/password login and registration
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../_cors.php';

require_once '../../services/authService.php';

$authService = new AuthService();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['action'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Action required'
            ]);
            exit;
        }
        
        switch ($input['action']) {
            case 'login':
                if (!isset($input['email']) || !isset($input['password'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Email and password required'
                    ]);
                    exit;
                }
                
                $result = $authService->login($input['email'], $input['password']);
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    http_response_code(401);
                    echo json_encode($result);
                }
                break;
                
            case 'register':
                if (!isset($input['username']) || !isset($input['email']) || !isset($input['password']) || !isset($input['full_name'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Username, email, password, and full name required'
                    ]);
                    exit;
                }
                
                $firstName = $input['first_name'] ?? null;
                $lastName = $input['last_name'] ?? null;
                $phone = $input['phone'] ?? null;
                
                $result = $authService->register(
                    $input['username'],
                    $input['email'],
                    $input['password'],
                    $input['full_name'],
                    $firstName,
                    $lastName,
                    $phone
                );
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode($result);
                }
                break;
                
            case 'forgot_password':
                if (!isset($input['email'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Email required'
                    ]);
                    exit;
                }
                
                $result = $authService->requestPasswordReset($input['email']);
                echo json_encode($result);
                break;
                
            case 'reset_password':
                if (!isset($input['token']) || !isset($input['new_password'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Token and new password required'
                    ]);
                    exit;
                }
                
                $result = $authService->resetPassword($input['token'], $input['new_password']);
                echo json_encode($result);
                break;
                
            case 'change_password':
                if (!isset($input['current_password']) || !isset($input['new_password'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Current password and new password required'
                    ]);
                    exit;
                }
                
                // Get user from session token
                $headers = getallheaders();
                $token = $headers['Authorization'] ?? $headers['authorization'] ?? null;
                
                if (!$token) {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Authentication required'
                    ]);
                    exit;
                }
                
                $token = str_replace('Bearer ', '', $token);
                $session = $authService->validateSession($token);
                
                if (!$session) {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Invalid or expired session'
                    ]);
                    exit;
                }
                
                $result = $authService->changePassword($session['user_id'], $input['current_password'], $input['new_password']);
                echo json_encode($result);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid action'
                ]);
        }
        
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>


