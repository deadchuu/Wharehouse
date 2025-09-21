<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_csv_helpers.php';
$path = __DIR__ . '/../data/orders.csv';
$rows = read_csv($path);
echo json_encode($rows, JSON_UNESCAPED_UNICODE);
