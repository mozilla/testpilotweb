<?php
//var_dump($_POST);
$croer_meta = $_POST;
$croer_meta_list = array();
foreach ($croer_meta as $key => $value ) {
	if($key != 'submit') {
		// if it has a limit or rank add to ar
		$c_meta_element = array();
		$c_meta_element['theID'] = substr($key, 3);
		// limit?
		// if limit, take out limit prefix and put value
		$limit_flag=false;
		if(substr($c_meta_element['theID'], 0, 6) == '_limit') {
			$limit_flag=true;
			$c_meta_element['theID'] = substr($key, 9);
			$c_meta_element['limit'] = $value;
		}
		// type
		$croer_x = substr($key, 0, 3);
		switch ($croer_x) {
			case 'cat':
				$c_meta_element['type'] = 'cat';
				break;
			case 'tag':
				$c_meta_element['type'] = 'tag';
				break;
		}
		// rank
		if(((substr($key, 0, 3) == 'cat')||(substr($key, 0, 3) == 'tag'))&&(!$limit_flag)&&($value != 3)) {
			$c_meta_element['rank'] = $value;
		}
		if ($c_meta_element['rank'] ) {
			$croer_meta_list[$c_meta_element['type'].$c_meta_element['theID']]['rank'] = $c_meta_element['rank'];
			$croer_meta_list[$c_meta_element['type'].$c_meta_element['theID']]['type'] = $c_meta_element['type'];
		}
		if ($c_meta_element['limit'] ) {
			$croer_meta_list[$c_meta_element['type'].$c_meta_element['theID']]['limit'] = $c_meta_element['limit'];
			$croer_meta_list[$c_meta_element['type'].$c_meta_element['theID']]['type'] = $c_meta_element['type'];
		}
	}
}
//echo "---<br>\n";
//print_r($croer_meta_list);
//
global $wpdb;
// get old meta
global $wpdb;
$sql = 'SELECT * FROM '.$wpdb->prefix.'croer_meta ';
$result = mysql_query($sql);
while ($row = mysql_fetch_array($result)) {
	extract($row);
	//echo "<br>while:row:";
	//print_r($row);
	//echo "<br>while:arr:";
	
	//print_r($croer_meta_list[$term_type.$term_id]);
	//echo "<br>doing term id:".$term_id." type:".$term_type;
	// if term not in  new meta_list delete it, 
	if (!array_key_exists($term_type.$term_id, $croer_meta_list))  {
		//echo " not in array, delete";
		$del_sql = "DELETE FROM ".$wpdb->prefix."croer_meta WHERE term_id = '$term_id' AND term_type = '$term_type'";
		$del_result = mysql_query($del_sql);
		//echo $del_sql."{".$del_result."}";
	} else {
		//echo " in array";
		$test_ar=$croer_meta_list[$term_type.$term_id];
		//print_r($test_ar);
		//echo "<br><br>";
		// if same ignore
		if (($test_ar['rank'] == $term_rank)&&($test_ar['type'] == $term_type)&&($test_ar['limit']==$limit_to)) {
			//
			//echo "<br>test ar:<br>";
			//print_r($test_ar);
			//echo "<br>id:".$term_id."rank:".$term_rank." type:".$term_type." limit:".$limit_to;
			//echo "<br>same,  do nada<br><br>";
		} else {
			// update
			$update_sql = "UPDATE ".$wpdb->prefix."croer_meta SET term_rank = '".$test_ar['rank']."', `limit_to` = '".$test_ar['limit']."' WHERE `term_id` = '".$term_id."' AND term_type = '".$test_ar['type']."' ;";
			$update_result = mysql_query($update_sql);
			//echo "<br>ud result=".$update_result." ".$update_sql;
		}
		// scrub from ar
		unset($croer_meta_list[$term_type.$term_id]);
	}
	
}
foreach ($croer_meta_list as $key => $value) {
	$insert_sql = "INSERT INTO ".$wpdb->prefix."croer_meta (`cmeta_id`, `term_id`, `term_rank`, `limit_to`, `term_type`) ".
	"VALUES (NULL, '".substr($key, 3)."', '".$value['rank']."', '".$value['limit']."', '".$value['type']."');";
	//echo 
	$result = mysql_query($insert_sql);
	//echo "<br>insert result = ".$result." ".$insert_sql;
}







?>







