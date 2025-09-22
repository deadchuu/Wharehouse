<?php
// api/scan.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_csv_helpers.php';

$dataDir = __DIR__ . '/../data';
@mkdir($dataDir, 0775, true);

$scansPath = $dataDir . '/scans.csv';
$itemsPath = $dataDir . '/picklist_items.csv';

$payload = json_decode(file_get_contents('php://input'), true);
if(!$payload || empty($payload['picklist_id']) || empty($payload['action'])){
  echo json_encode(['success'=>false,'message'=>'Nieprawidłowy żądanie']); exit;
}
$picklist_id = $payload['picklist_id'];
$action = $payload['action'];
$user = $payload['user'] ?? 'unknown';
$ts = date('c');

if($action === 'scan'){
  // required: order_code or order_id and sku
  $order_code = $payload['order_code'] ?? '';
  $order_id = $payload['order_id'] ?? '';
  $sku = $payload['sku'] ?? '';
  $bin_number = $payload['bin_number'] ?? '';

  if(!$sku || (!$order_code && !$order_id)){ echo json_encode(['success'=>false,'message'=>'Brak SKU lub order']); exit; }

  // Append to scans.csv
  $scanRow = [
    'id' => 'scan' . time() . rand(10,99),
    'picklist_id' => $picklist_id,
    'order_id' => $order_id,
    'order_code' => $order_code,
    'sku' => $sku,
    'user' => $user,
    'bin_number' => $bin_number,
    'ts' => $ts,
    'action' => 'scan'
  ];
  write_csv_row($scansPath, $scanRow, array_keys($scanRow));

  // Update picklist_items.csv: find matching picklist_id and order_id OR order_code
  $items = read_csv($itemsPath);
  $updated = false;
  for($i=0;$i<count($items);$i++){
    if($items[$i]['picklist_id'] === $picklist_id && ($items[$i]['order_id'] === $order_id || $items[$i]['order_code'] === $order_code)){
      // increment scanned_count
      $items[$i]['scanned_count'] = (int)($items[$i]['scanned_count'] ?? 0) + 1;
      // if no bin_number set, set it
      if(empty($items[$i]['bin_number']) && !empty($bin_number)){
        $items[$i]['bin_number'] = $bin_number;
      }
      // if scanned_count >= qty -> status 'collected'
      if((int)$items[$i]['scanned_count'] >= (int)($items[$i]['qty'] ?? 1)){
        $items[$i]['status'] = 'collected';
      }
      $updated = true;
      break;
    }
  }
  if($updated){
    overwrite_csv($itemsPath, $items);
  }

  echo json_encode(['success'=>true]); exit;
}

if($action === 'close_bin'){
  $bin_number = $payload['bin_number'] ?? '';
  // Log close bin action
  $scanRow = [
    'id' => 'scan' . time() . rand(10,99),
    'picklist_id' => $picklist_id,
    'order_id' => '',
    'order_code' => '',
    'sku' => '',
    'user' => $user,
    'bin_number' => $bin_number,
    'ts' => $ts,
    'action' => 'close_bin'
  ];
  write_csv_row($scansPath, $scanRow, array_keys($scanRow));
  echo json_encode(['success'=>true]); exit;
}

echo json_encode(['success'=>false,'message'=>'Akcja nieobsługiwana']);
