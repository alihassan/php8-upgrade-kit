<?php
class Auth { static function check() { return true; } function user() { return 1; } }
if (Auth::check()) {}
class Admin extends Auth { function user() { return Auth::user(); } }
VendorThing::run();
