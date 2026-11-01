<?php

// Every error level, deprecations included: a deprecation today is an error in the next major version.
define('TEST_ERROR_REPORTING', E_ALL);

/**
 * A tiny HTTP client with a cookie jar, built on file_get_contents so the
 * tests need no extra packages.
 */
final class Http
{
    private $cookies = [];

    /** @return array{status:int, headers:array<string,string>, body:string} */
    public function get($path)
    {
        return $this->request('GET', $path);
    }

    public function post($path, array $fields)
    {
        return $this->request('POST', $path, http_build_query($fields));
    }

    public function signIn()
    {
        $res = $this->post('/login.php', ['email' => 'admin@example.com', 'password' => 'secret']);
        if ($res['status'] !== 302) {
            throw new RuntimeException("Sign-in failed with HTTP {$res['status']}:\n" . substr($res['body'], 0, 2000));
        }
        return $this;
    }

    private function request($method, $path, $body = null)
    {
        $headers = [];
        if ($this->cookies) {
            $pairs = [];
            foreach ($this->cookies as $k => $v) {
                $pairs[] = $k . '=' . $v;
            }
            $headers[] = 'Cookie: ' . implode('; ', $pairs);
        }
        if ($body !== null) {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        }
        $context = stream_context_create(['http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => $body ?? '',
            'follow_location' => 0,
            'ignore_errors' => true,
            'timeout' => 60,
        ]]);
        $content = file_get_contents(BASE_URL . $path, false, $context);
        $status = 0;
        $parsed = [];
        foreach ($http_response_header as $line) {
            if (preg_match('#^HTTP/\S+ (\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            } elseif (str_contains($line, ':')) {
                [$name, $value] = explode(':', $line, 2);
                $parsed[strtolower(trim($name))] = trim($value);
                if (strtolower(trim($name)) === 'set-cookie' && preg_match('/^([^=]+)=([^;]*)/', trim($value), $c)) {
                    $this->cookies[$c[1]] = $c[2];
                }
            }
        }
        return ['status' => $status, 'headers' => $parsed, 'body' => (string) $content];
    }
}
