<?php
/**
 * Authentication Middleware
 * Handles role-based access control
 */

require_once __DIR__ . '/../../services/authService.php';

class AuthMiddleware {
    private $authService;
    
    public function __construct() {
        $this->authService = new AuthService();
    }
    
    /**
     * Check if user is authenticated
     */
    public function requireAuth() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Authentication required'
            ]);
            exit;
        }
        
        // Remove 'Bearer ' prefix if present
        $token = str_replace('Bearer ', '', $token);
        
        $session = $this->authService->validateSession($token);
        
        if (!$session) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid or expired session'
            ]);
            exit;
        }
        
        return $session;
    }
    
    /**
     * Check if user has admin role
     */
    public function requireAdmin() {
        $session = $this->requireAuth();
        
        if ($session['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Admin access required'
            ]);
            exit;
        }
        
        return $session;
    }
    
    /**
     * Check if user has specific role
     */
    public function requireRole($requiredRole) {
        $session = $this->requireAuth();
        
        if ($session['role'] !== $requiredRole) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => ucfirst($requiredRole) . ' access required'
            ]);
            exit;
        }
        
        return $session;
    }
    
    /**
     * Get current user from session
     */
    public function getCurrentUser() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$token) {
            return null;
        }
        
        $token = str_replace('Bearer ', '', $token);
        return $this->authService->validateSession($token);
    }
}

// Helper function to get all headers (for compatibility)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
?>
