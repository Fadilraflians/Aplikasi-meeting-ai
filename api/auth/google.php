<?php
/**
 * Google OAuth Authentication Endpoint
 * Handles Google OAuth login and registration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../services/oauthService.php';

$oauthService = new OAuthService();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Generate Google OAuth URL
        $authUrl = $oauthService->getGoogleAuthUrl();
        
        echo json_encode([
            'success' => true,
            'auth_url' => $authUrl,
            'message' => 'Google OAuth URL generated successfully'
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle OAuth callback
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['code']) || !isset($input['state'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Missing required parameters: code and state'
            ]);
            exit;
        }
        
        $code = $input['code'];
        $state = $input['state'];
        
        // Process Google OAuth callback
        $result = $oauthService->handleGoogleCallback($code, $state);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Google OAuth authentication successful',
                'data' => $result
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Google OAuth authentication failed'
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
