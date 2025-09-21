<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/_csv_helpers.php';

$dataDir = __DIR__ . '/../data';
@mkdir($dataDir, 0775, true);

$picklistsPath = $dataDir . '/picklists.csv';
$itemsPath = $dataDir . '/picklist_items.csv';
$productsPath = $dataDir . '/products.csv';
$ordersPath = $dataDir . '/orders.csv';

// GET: list all picklists OR fetch single if id provided
if($_SERVER['REQUEST_METHOD'] === 'GET'){
  $id = $_GET['id'] ?? null;
  $pls = read_csv($picklistsPath);
  $items = read_csv($itemsPath);
  $grouped = [];
  foreach($items as $it) $grouped[$it['picklist_id']][] = $it;
  if($id){
    foreach($pls as $pl){
      if($pl['id'] === $id){
        $pl['items'] = $grouped[$pl['id']] ?? [];
        echo json_encode($pl, JSON_UNESCAPED_UNICODE);
        exit;
      }
    }
    echo json_encode(['success'=>false,'message'=>'Not found']);
    exit;
  } else {
    // attach counts
    foreach($pls as &$pl){
      $pl['items'] = $grouped[$pl['id']] ?? [];
    }
    echo json_encode($pls, JSON_UNESCAPED_UNICODE);
    exit;
  }
}

if($_SERVER['REQUEST_METHOD'] === 'POST'){
  // create picklist
  $payload = json_decode(file_get_contents('php://input'), true);
  if(!$payload || empty($payload['order_ids']) || empty($payload['name'])){
    echo json_encode(['success'=>false,'message'=>'Invalid payload']); exit;
  }
  $order_ids = $payload['order_ids'];
  $name = trim($payload['name']);
  $operator = trim($payload['operator'] ?? '');
  $picklist_id = 'PL-' . time() . '-' . rand(100,999);

  $picklistRow = [
    'id' => $picklist_id,
    'name' => $name,
    'operator' => $operator,
    'created_at' => date('c')
  ];
  write_csv_row($picklistsPath, $picklistRow, array_keys($picklistRow));

  // read orders/products mapping
  $products = read_csv($productsPath); $prodMap = [];
  foreach($products as $p) $prodMap[$p['sku']] = $p;

  $orders = read_csv($ordersPath);

  foreach($order_ids as $oid){
    // find order
    $order = null;
    foreach($orders as $o) {
      if(($o['order_id'] ?? '') === $oid || ($o['order_number'] ?? '') === $oid) { $order = $o; break; }
    }
    $order_code = 'OC-' . date('Ymd') . '-' . substr(md5($oid . rand()),0,6);
    $skus = [];
    if($order && !empty($order['sku'])) $skus = array_map('trim', explode(';', str_replace(',', ';', $order['sku'])));
    $itemRow = [
      'picklist_id' => $picklist_id,
      'order_id' => $oid,
      'order_code' => $order_code,
      'skus' => implode('|', $skus),
      'qty' => $order['items'] ?? 1,
      'status' => 'pending',
      'scanned_count' => 0,
      'bin_number' => ''
    ];
    write_csv_row($itemsPath, $itemRow, array_keys($itemRow));
  }

  echo json_encode(['success'=>true,'picklist_id'=>$picklist_id]);
  exit;
}

echo json_encode(['success'=>false,'message'=>'Method not allowed']);
