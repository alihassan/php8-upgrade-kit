<?php

class Auth
{
    public static function check()
    {
        return isset($_SESSION['user_id']);
    }

    public static function attempt($email, $password)
    {
        $user = db_one('SELECT * FROM users WHERE email = ?', [$email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return false;
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        return true;
    }

    public static function user()
    {
        return $_SESSION['user_name'] ?? null;
    }

    public static function logout()
    {
        $_SESSION = [];
        session_destroy();
    }
}
