<?php
// api/export.php?file=picklist_{id}
require_once __DIR__ . '/_csv_helpers.php';
$dataDir = __DIR__ . '/../data';
$itemsPath = $dataDir . '/picklist_items.csv';
$picklistsPath = $dataDir . '/picklists.csv';

$file = $_GET['file'] ?? '';
if(!$file) { http_response_code(400); echo "No file"; exit; }

if(strpos($file, 'picklist_') === 0){
  $id = substr($file, strlen('picklist_'));
  $pls = read_csv($picklistsPath);
  $found = null;
  foreach($pls as $p) if($p['id'] === $id) { $found = $p; break; }
  if(!$found){ http_response_code(404); echo "Not found"; exit; }
  $items = read_csv($itemsPath);
  $rows = array_filter($items, function($it) use ($id){ return $it['picklist_id'] === $id; });
  // prepare CSV
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="picklist_'.$id.'.csv"');
  $out = fopen('php://output', 'w');
  if(!empty($rows)){
    fputcsv($out, array_keys($rows[0]));
    foreach($rows as $r) fputcsv($out, $r);
  } else {
    fputcsv($out, ['picklist_id','order_id','order_code','skus','qty','status','scanned_count','bin_number']);
  }
  fclose($out);
  exit;
}

http_response_code(400);
echo "Unsupported";
