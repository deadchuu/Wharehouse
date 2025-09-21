<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_csv_helpers.php';
$path = __DIR__ . '/../data/products.csv';

if($_SERVER['REQUEST_METHOD'] === 'GET'){
  $rows = read_csv($path);
  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
  exit;
}

// POST: upload CSV file to replace products
if($_SERVER['REQUEST_METHOD'] === 'POST'){
  if(!isset($_FILES['file'])){ echo json_encode(['success'=>false,'message'=>'Brak pliku']); exit; }
  $tmp = $_FILES['file']['tmp_name'];
  if(!is_uploaded_file($tmp)){ echo json_encode(['success'=>false,'message'=>'Błąd upload']); exit; }
  // proste: nadpisz plik products.csv
  if(!move_uploaded_file($tmp, $path)){ echo json_encode(['success'=>false,'message'=>'Nie udało się zapisać pliku']); exit; }
  echo json_encode(['success'=>true]);
  exit;
}

echo json_encode(['success'=>false,'message'=>'Metoda niedozwolona']);
