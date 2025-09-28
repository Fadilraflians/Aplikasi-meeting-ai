<?php
/**
 * OAuth Service for Spacio Meeting Room Booker
 * Handles Google and Facebook OAuth authentication
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/oauth.php';

class OAuthService {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    /**
     * Generate Google OAuth URL
     */
    public function getGoogleAuthUrl() {
        $state = generateOAuthState();
        
        // Store state in session for verification
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['oauth_state'] = $state;
        
        $params = [
            'client_id' => GOOGLE_CLIENT_ID,
            'redirect_uri' => GOOGLE_REDIRECT_URI,
            'scope' => GOOGLE_SCOPES,
            'response_type' => 'code',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'consent'
        ];
        
        return GOOGLE_AUTH_URL . '?' . http_build_query($params);
    }
    
    /**
     * Generate Facebook OAuth URL
     */
    public function getFacebookAuthUrl() {
        $state = generateOAuthState();
        
        // Store state in session for verification
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['oauth_state'] = $state;
        
        $params = [
            'client_id' => FACEBOOK_APP_ID,
            'redirect_uri' => FACEBOOK_REDIRECT_URI,
            'scope' => FACEBOOK_SCOPES,
            'response_type' => 'code',
            'state' => $state
        ];
        
        return FACEBOOK_AUTH_URL . '?' . http_build_query($params);
    }
    
    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback($code, $state) {
        // Verify state
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['oauth_state']) || !verifyOAuthState($state, $_SESSION['oauth_state'])) {
            errorResponse('Invalid OAuth state', 400);
        }
        
        // Exchange code for access token
        $tokenData = $this->exchangeGoogleCode($code);
        if (!$tokenData) {
            errorResponse('Failed to exchange code for token', 400);
        }
        
        // Get user info from Google
        $userInfo = $this->getGoogleUserInfo($tokenData['access_token']);
        if (!$userInfo) {
            errorResponse('Failed to get user info from Google', 400);
        }
        
        // Process user login/registration
        $user = $this->processOAuthUser('google', $userInfo);
        
        // Generate session tokens
        $sessionData = $this->createUserSession($user['id']);
        
        // Clear OAuth state
        unset($_SESSION['oauth_state']);
        
        return [
            'user' => $user,
            'session' => $sessionData
        ];
    }
    
    /**
     * Handle Facebook OAuth callback
     */
    public function handleFacebookCallback($code, $state) {
        // Verify state
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['oauth_state']) || !verifyOAuthState($state, $_SESSION['oauth_state'])) {
            errorResponse('Invalid OAuth state', 400);
        }
        
        // Exchange code for access token
        $tokenData = $this->exchangeFacebookCode($code);
        if (!$tokenData) {
            errorResponse('Failed to exchange code for token', 400);
        }
        
        // Get user info from Facebook
        $userInfo = $this->getFacebookUserInfo($tokenData['access_token']);
        if (!$userInfo) {
            errorResponse('Failed to get user info from Facebook', 400);
        }
        
        // Process user login/registration
        $user = $this->processOAuthUser('facebook', $userInfo);
        
        // Generate session tokens
        $sessionData = $this->createUserSession($user['id']);
        
        // Clear OAuth state
        unset($_SESSION['oauth_state']);
        
        return [
            'user' => $user,
            'session' => $sessionData
        ];
    }
    
    /**
     * Exchange authorization code for access token (Google)
     */
    private function exchangeGoogleCode($code) {
        $data = [
            'client_id' => GOOGLE_CLIENT_ID,
            'client_secret' => GOOGLE_CLIENT_SECRET,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => GOOGLE_REDIRECT_URI
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, GOOGLE_TOKEN_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Exchange authorization code for access token (Facebook)
     */
    private function exchangeFacebookCode($code) {
        $data = [
            'client_id' => FACEBOOK_APP_ID,
            'client_secret' => FACEBOOK_APP_SECRET,
            'code' => $code,
            'redirect_uri' => FACEBOOK_REDIRECT_URI
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, FACEBOOK_TOKEN_URL . '?' . http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Get user info from Google
     */
    private function getGoogleUserInfo($accessToken) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, GOOGLE_USERINFO_URL . '?access_token=' . $accessToken);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Get user info from Facebook
     */
    private function getFacebookUserInfo($accessToken) {
        $fields = 'id,name,email,first_name,last_name,picture';
        $url = FACEBOOK_USERINFO_URL . '?fields=' . $fields . '&access_token=' . $accessToken;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Process OAuth user (login or register)
     */
    private function processOAuthUser($provider, $userInfo) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            errorResponse('Database connection failed', 500);
        }
        
        try {
            // Check if OAuth account already exists
            $stmt = $conn->prepare("
                SELECT u.* FROM users u 
                JOIN oauth_providers op ON u.id = op.user_id 
                WHERE op.provider = ? AND op.provider_user_id = ?
            ");
            $stmt->execute([$provider, $userInfo['id']]);
            $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingUser) {
                // Update last login
                $stmt = $conn->prepare("UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?");
                $stmt->execute([$existingUser['id']]);
                return $existingUser;
            }
            
            // Check if email exists
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$userInfo['email']]);
            $existingEmailUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingEmailUser) {
                // Link existing account
                $stmt = $conn->prepare("
                    INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([
                    $existingEmailUser['id'],
                    $provider,
                    $userInfo['id'],
                    $userInfo['email']
                ]);
                
                // Update last login
                $stmt = $conn->prepare("UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?");
                $stmt->execute([$existingEmailUser['id']]);
                
                return $existingEmailUser;
            }
            
            // Create new user
            $username = $provider . '_' . $userInfo['id'];
            $fullName = $userInfo['name'] ?? ($userInfo['first_name'] . ' ' . $userInfo['last_name']);
            $firstName = $userInfo['first_name'] ?? '';
            $lastName = $userInfo['last_name'] ?? '';
            $avatarUrl = $userInfo['picture']['data']['url'] ?? $userInfo['picture'] ?? null;
            
            $stmt = $conn->prepare("
                INSERT INTO users (username, email, full_name, first_name, last_name, avatar_url, email_verified) 
                VALUES (?, ?, ?, ?, ?, ?, TRUE)
            ");
            $stmt->execute([$username, $userInfo['email'], $fullName, $firstName, $lastName, $avatarUrl]);
            $userId = $conn->lastInsertId();
            
            // Add OAuth provider
            $stmt = $conn->prepare("
                INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $provider, $userInfo['id'], $userInfo['email']]);
            
            // Get created user
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Create user session
     */
    private function createUserSession($userId) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            errorResponse('Database connection failed', 500);
        }
        
        try {
            $sessionToken = generateSecureToken();
            $refreshToken = generateRefreshToken();
            $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            $stmt = $conn->prepare("
                INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $sessionToken, $refreshToken, $ipAddress, $userAgent, $expiresAt]);
            
            return [
                'session_token' => $sessionToken,
                'refresh_token' => $refreshToken,
                'expires_at' => $expiresAt
            ];
            
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Validate session token
     */
    public function validateSession($sessionToken) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
        }
        
        try {
            $stmt = $conn->prepare("
                SELECT us.*, u.* FROM user_sessions us 
                JOIN users u ON us.user_id = u.id 
                WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > NOW()
            ");
            $stmt->execute([$sessionToken]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session) {
                // Update last activity
                $stmt = $conn->prepare("UPDATE user_sessions SET expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE id = ?");
                $stmt->execute([SESSION_LIFETIME, $session['id']]);
                return $session;
            }
            
            return false;
            
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Refresh session token
     */
    public function refreshSession($refreshToken) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
        }
        
        try {
            $stmt = $conn->prepare("
                SELECT us.*, u.* FROM user_sessions us 
                JOIN users u ON us.user_id = u.id 
                WHERE us.refresh_token = ? AND us.is_active = 1
            ");
            $stmt->execute([$refreshToken]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session) {
                // Generate new session token
                $newSessionToken = generateSecureToken();
                $newRefreshToken = generateRefreshToken();
                $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
                
                $stmt = $conn->prepare("
                    UPDATE user_sessions 
                    SET session_token = ?, refresh_token = ?, expires_at = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$newSessionToken, $newRefreshToken, $expiresAt, $session['id']]);
                
                return [
                    'session_token' => $newSessionToken,
                    'refresh_token' => $newRefreshToken,
                    'expires_at' => $expiresAt,
                    'user' => $session
                ];
            }
            
            return false;
            
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Logout user (invalidate session)
     */
    public function logout($sessionToken) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE user_sessions SET is_active = 0 WHERE session_token = ?");
            return $stmt->execute([$sessionToken]);
            
        } catch (PDOException $e) {
            return false;
        }
    }
}
?>
