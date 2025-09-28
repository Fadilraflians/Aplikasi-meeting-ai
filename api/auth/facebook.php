<?php
/**
 * Facebook OAuth Authentication Endpoint
 * Handles Facebook OAuth login and registration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../services/oauthService.php';

$oauthService = new OAuthService();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Generate Facebook OAuth URL
        $authUrl = $oauthService->getFacebookAuthUrl();
        
        echo json_encode([
            'success' => true,
            'auth_url' => $authUrl,
            'message' => 'Facebook OAuth URL generated successfully'
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
        
        // Process Facebook OAuth callback
        $result = $oauthService->handleFacebookCallback($code, $state);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Facebook OAuth authentication successful',
                'data' => $result
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Facebook OAuth authentication failed'
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


