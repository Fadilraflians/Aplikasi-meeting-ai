<?php
/**
 * Authentication Service for Spacio Meeting Room Booker
 * Handles user registration, login, and session management
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/oauth.php';

// Define session lifetime (24 hours in seconds)
if (!defined('SESSION_LIFETIME')) {
    define('SESSION_LIFETIME', 24 * 60 * 60); // 24 hours
}

class AuthService {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    /**
     * User Registration
     */
    public function register($username, $email, $password, $fullName, $firstName = null, $lastName = null, $phone = null) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            // Check if username or email already exists
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Username or email already exists'];
            }
            
            // Store password as plain text (as requested)
            
            // Insert new user (default role is 'user')
            $stmt = $conn->prepare("
                INSERT INTO users (username, email, password, full_name, first_name, last_name, phone, role, is_active, login_count, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1, 0, NOW(), NOW())
            ");
            $stmt->execute([$username, $email, $password, $fullName, $firstName, $lastName, $phone]);
            
            $userId = $conn->lastInsertId();
            
            // Get created user (without password)
            $stmt = $conn->prepare("
                SELECT id, username, email, role, full_name, first_name, last_name, phone, created_at 
                FROM users WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user
                ]
            ];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * User Login
     */
    public function login($email, $password) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            // Find user by email
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                return ['success' => false, 'message' => 'User not found or inactive'];
            }
            
            // Check if user has password (not OAuth only)
            if (!$user['password']) {
                return ['success' => false, 'message' => 'This account requires OAuth login'];
            }
            
            // Verify password (plain text comparison)
            if ($password !== $user['password']) {
                return ['success' => false, 'message' => 'Invalid password'];
            }
            
            // Update last login
            $stmt = $conn->prepare("UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Create session
            $session = $this->createUserSession($user['id']);
            
            // Remove password from response
            unset($user['password']);
            
            return [
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'session' => $session
                ]
            ];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Login failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Create user session
     */
    private function createUserSession($userId) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
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
            return false;
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
    
    /**
     * Logout all sessions for a user (for security after password change)
     */
    public function logoutAllSessions($userId) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE user_sessions SET is_active = 0 WHERE user_id = ?");
            return $stmt->execute([$userId]);
            
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get user profile
     */
    public function getUserProfile($userId) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return false;
        }
        
        try {
            $stmt = $conn->prepare("
                SELECT u.*, 
                       GROUP_CONCAT(DISTINCT op.provider) as oauth_providers
                FROM users u 
                LEFT JOIN oauth_providers op ON u.id = op.user_id 
                WHERE u.id = ? 
                GROUP BY u.id
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Update user profile
     */
    public function updateUserProfile($userId, $data) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            $allowedFields = ['full_name', 'first_name', 'last_name', 'phone', 'bio'];
            $updateFields = [];
            $updateValues = [];
            
            foreach ($data as $field => $value) {
                if (in_array($field, $allowedFields)) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $value;
                }
            }
            
            if (empty($updateFields)) {
                return ['success' => false, 'message' => 'No valid fields to update'];
            }
            
            $updateValues[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute($updateValues);
            
            return ['success' => true, 'message' => 'Profile updated successfully'];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Profile update failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Change password
     */
    public function changePassword($userId, $currentPassword, $newPassword) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            // Get current password
            $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !$user['password']) {
                return ['success' => false, 'message' => 'User not found or OAuth account'];
            }
            
            // Verify current password (plain text comparison)
            if ($currentPassword !== $user['password']) {
                return ['success' => false, 'message' => 'Current password is incorrect'];
            }
            
            // Store new password as plain text
            // $newPasswordHash = hashPassword($newPassword);
            
            // Update password
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$newPassword, $userId]);
            
            // Logout all sessions for security (force re-login with new password)
            $this->logoutAllSessions($userId);
            
            return ['success' => true, 'message' => 'Password changed successfully. Please login again.'];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Password change failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Request password reset
     */
    public function requestPasswordReset($email) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            // Check if user exists
            $stmt = $conn->prepare("SELECT id, full_name FROM users WHERE email = ? AND is_active = 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            // Generate reset token
            $resetToken = generateSecureToken();
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            
            // Store reset token
            $stmt = $conn->prepare("
                INSERT INTO user_verification (user_id, type, token, expires_at) 
                VALUES (?, 'password_reset', ?, ?)
            ");
            $stmt->execute([$user['id'], $resetToken, $expiresAt]);
            
            // TODO: Send email with reset link
            // For now, just return the token (in production, send email)
            
            return [
                'success' => true, 
                'message' => 'Password reset link sent to your email',
                'data' => [
                    'reset_token' => $resetToken, // Remove this in production
                    'expires_at' => $expiresAt
                ]
            ];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Password reset request failed: ' . $e->getMessage()];
        }
    }
    
    /**
     * Reset password with token
     */
    public function resetPassword($resetToken, $newPassword) {
        $conn = $this->db->getConnection();
        if (!$conn) {
            return ['success' => false, 'message' => 'Database connection failed'];
        }
        
        try {
            // Find valid reset token
            $stmt = $conn->prepare("
                SELECT uv.*, u.id as user_id 
                FROM user_verification uv 
                JOIN users u ON uv.user_id = u.id 
                WHERE uv.token = ? AND uv.type = 'password_reset' 
                AND uv.expires_at > NOW() AND uv.is_used = 0
            ");
            $stmt->execute([$resetToken]);
            $verification = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$verification) {
                return ['success' => false, 'message' => 'Invalid or expired reset token'];
            }
            
            // Store new password as plain text
            // $newPasswordHash = hashPassword($newPassword);
            
            // Update password
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$newPassword, $verification['user_id']]);
            
            // Mark token as used
            $stmt = $conn->prepare("UPDATE user_verification SET is_used = 1 WHERE id = ?");
            $stmt->execute([$verification['id']]);
            
            return ['success' => true, 'message' => 'Password reset successfully'];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Password reset failed: ' . $e->getMessage()];
        }
    }
}
?>


