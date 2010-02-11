<?php
$croer_list = $_POST;
$croer_action = $croer_list[submit];
require_once('croer-functions.php');
if ($croer_action == 'Save and Refresh') {
	// lets clean up the incomming
	$croer_ins_buffer = array(); // to hold what needs to be inserted
	foreach ($croer_list as $croer_pid => $croer_element) {
		if ((!strncmp($croer_pid, 'pid', 3))&&($croer_element!='')) {
			$croer_ins_buffer[substr($croer_pid,3)]=$croer_element;
		}
	}
}
$croer_cat = $croer_list[croer_cat];
if ($croer_ins_buffer) {
	asort($croer_ins_buffer);
}
$croer_old_sorts = croer_get_just_sorted($croer_cat);
while ($row= mysql_fetch_array($croer_old_sorts)) {
	$croer_old_sorts_r[$row[post_id]]=$row[post_rank];
}
if ($croer_old_sorts_r) {
	asort($croer_old_sorts_r);
}
// loop through ellements to insert in new array
// keep offset
$c_new_inserts=array();
$c_removals=array();
$c_ofset=0;
if ($croer_ins_buffer) {
	echo "<!-- >We have insertions< -->";
	foreach($croer_ins_buffer as $croer_ins_pid => $croer_ins_pos) {
		if ($croer_ins_pos==0){
			$c_removals[]= $croer_ins_pid;
			$c_inserted=true;
		}
		$c_inserted=false;
		if (!array_key_exists( $croer_ins_pid,$c_new_inserts)){
			// we dont have this pid, place it in next available position
			while(!$c_inserted) {
				$pos = $c_ofset+$croer_ins_pos;
				if (!array_search($pos, $c_new_inserts)){
					if (array_search($croer_ins_pid, $c_removals)>-1) {
						$c_inserted=true;
					} else {
						$c_new_inserts[$croer_ins_pid]=$pos;
						$c_inserted=true;
					}
				} else {
					$c_ofset++;
				}
			}
		}
	}
}
$c_ofset=0;
if ($croer_old_sorts_r){
	echo "<!-- >We have old sorties< -->";
	foreach($croer_old_sorts_r as $croer_old_pid => $croer_old_pos) {
		$c_inserted=false;
		if (!array_key_exists( $croer_old_pid,$c_new_inserts)){
			while(!$c_inserted) {
				$pos = $c_ofset+$croer_old_pos;
				if (!array_search($pos, $c_new_inserts)){
					if (array_search($croer_old_pid, $c_removals)>-1) {
						$c_inserted=true;
					} else {
						$c_new_inserts[$croer_old_pid]=$pos;
						$c_inserted=true;
					}
				} else {
					$c_ofset++;
				}
			}
		} 
	}
}
asort($c_new_inserts);
// tidy up - i.o.w. push sorties to the top
// todo : make this depend on user switch
$croer_replace_buffer = array();
if ($c_new_inserts){
	$c_count = 1;
	foreach($c_new_inserts as $c_pid => $c_pos) {
		$croer_replace_buffer[$c_count]=$c_pid;
		$c_count++;
	}
}
//remove old
global $wpdb;
$query= "DELETE ".
	 "FROM ".$wpdb->prefix."croer_posts ".
	 "WHERE cat_id = $croer_cat ";
	 
$result = mysql_query($query) or die("errr:".mysql_error());

//insert new
$insert_count=0;
foreach($c_new_inserts as $c_pid => $c_pos) {
$insert_count++;
	$sql= "INSERT INTO ".$wpdb->prefix."croer_posts (croer_id, post_id, cat_id, post_rank) ".
		"VALUES (NULL, '$c_pid', '$croer_cat', '$insert_count')";
	$result= mysql_query($sql) or die("errr:".mysql_error());
}
//
?>







