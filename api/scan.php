<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_csv_helpers.php';

$dataDir = __DIR__ . '/../data';
@mkdir($dataDir, 0775, true);

$scansPath = $dataDir . '/scans.csv';
$itemsPath = $dataDir . '/picklist_items.csv';

// POST { picklist_id, order_code, sku, user }
if($_SERVER['REQUEST_METHOD'] !== 'POST'){
  echo json_encode(['success'=>false,'message'=>'Metoda niedozwolona']); exit;
}
$payload = json_decode(file_get_contents('php://input'), true);
if(!$payload || empty($payload['picklist_id']) || empty($payload['order_code']) || empty($payload['sku'])){
  echo json_encode(['success'=>false,'message'=>'Brak wymaganych pól']); exit;
}
$picklist_id = $payload['picklist_id'];
$order_code = $payload['order_code'];
$sku = $payload['sku'];
$user = $payload['user'] ?? 'unknown';

// write scan record
$scanRow = ['id' => 'scan' . time() . rand(10,99), 'picklist_id'=>$picklist_id, 'order_code'=>$order_code, 'sku'=>$sku, 'user'=>$user, 'ts'=>date('c')];
write_csv_row($scansPath, $scanRow, array_keys($scanRow));

// Update scanned_count in picklist_items.csv (increment where picklist_id+order_code+sku match or on first sku)
$items = read_csv($itemsPath);
$changed = false;
for($i=0;$i<count($items);$i++){
  if($items[$i]['picklist_id'] === $picklist_id && $items[$i]['order_code'] === $order_code){
    // increment scanned_count
    $items[$i]['scanned_count'] = (int)($items[$i]['scanned_count'] ?? 0) + 1;
    $changed = true;
    // do not break — there may be multiple items matching; we increment first matching
    break;
  }
}
if($changed){
  overwrite_csv($itemsPath, $items);
}

echo json_encode(['success'=>true]);
