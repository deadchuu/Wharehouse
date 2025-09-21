<?php
// _csv_helpers.php -- proste funkcje do czytania i zapisu CSV (blokowanie pliku)
function read_csv($path){
  $rows = [];
  if(!file_exists($path)) return $rows;
  if (($fp = fopen($path, 'r')) !== false){
    $headers = fgetcsv($fp);
    if($headers === false){ fclose($fp); return $rows; }
    while(($data = fgetcsv($fp)) !== false){
      $row = [];
      for($i=0;$i<count($headers);$i++){
        $row[$headers[$i]] = isset($data[$i]) ? $data[$i] : '';
      }
      $rows[] = $row;
    }
    fclose($fp);
  }
  return $rows;
}

function write_csv_row($path, $row_assoc, $headers = null){
  $is_new = !file_exists($path);
  if($is_new && !$headers) $headers = array_keys($row_assoc);
  $fp = fopen($path, 'a');
  if($fp === false) return false;
  if(flock($fp, LOCK_EX)){
    if($is_new && $headers) fputcsv($fp, $headers);
    fputcsv($fp, array_map(function($h) use ($row_assoc){ return isset($row_assoc[$h]) ? $row_assoc[$h] : ''; }, $headers ?? array_keys($row_assoc)));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
  } else {
    fclose($fp);
    return false;
  }
}

function overwrite_csv($path, $rows_assoc){
  if(empty($rows_assoc)){ file_put_contents($path, ""); return true; }
  $headers = array_keys($rows_assoc[0]);
  $fp = fopen($path, 'w');
  if($fp === false) return false;
  if(flock($fp, LOCK_EX)){
    fputcsv($fp, $headers);
    foreach($rows_assoc as $r) fputcsv($fp, array_map(function($h) use ($r){ return isset($r[$h]) ? $r[$h] : ''; }, $headers));
    fflush($fp); flock($fp, LOCK_UN); fclose($fp); return true;
  } else { fclose($fp); return false; }
}
