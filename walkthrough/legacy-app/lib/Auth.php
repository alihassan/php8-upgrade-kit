<?php

class Auth
{
    function check()
    {
        return isset($_SESSION['user_id']);
    }

    function attempt($email, $password)
    {
        $user = db_one('SELECT * FROM users WHERE email = ?', array($email));
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return false;
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        return true;
    }

    function user()
    {
        return isset($_SESSION['user_name']) ? $_SESSION['user_name'] : null;
    }

    function logout()
    {
        $_SESSION = array();
        session_destroy();
    }
}
