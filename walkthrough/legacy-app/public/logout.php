<?php
require __DIR__ . '/../lib/bootstrap.php';

Auth::logout();
redirect('login.php');
