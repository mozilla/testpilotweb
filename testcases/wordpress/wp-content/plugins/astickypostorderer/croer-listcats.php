<?php 
// list choice of categories for which to re arrange posts

?>

<h3><?php _e('Categories') ?></h3>

<table class="widefat">
  <thead>
	<tr>
	  <th scope="col" style="text-align: center" rowspan="2"><?php _e('ID') ?></th>
	  <th scope="col" rowspan="2"><?php _e('Name') ?></th>
	  <th scope="col" colspan="4" style="text-align: center"><?php _e('Meta-stickyness') ?></th>
	  <th scope="col" width="90" style="text-align: center" rowspan="2"><?php _e('sorted / in&nbsp;this&nbsp;cat.') ?></th>
	</tr>
	<tr>
	  <th scope="col" style="text-align: center">Super-sticky [Limit]</th>
	  <th scope="col" style="text-align: center">Sub-sticky</th>
	  <th scope="col" style="text-align: center">Default</th>
	  <th scope="col" style="text-align: center">Droppy</th>
	</tr>
  </thead>
  <tbody id="the-list"><?php croer_cat_rows($meta_old); ?>
  </tbody>
</table>

<?php 
function croer_cat_rows($meta_old) {
// start from the top, work down
	global $wpdb;
	croer_feth_for_parent(0,0,0,$meta_old);
}
function croer_feth_for_parent($c_parent, $c_indent, $tr_count, $meta_old) {
	
	$c_level = croer_get_cats_in_sql($c_parent, 'category');///
	
	//print_r($meta_old);
	while ($row = mysql_fetch_array($c_level)) {
		// init defaults as neccesary
		$c_thecat=$row[term_id];
		if(!$meta_old['cat'.$c_thecat]) {
			$meta_old['cat'.$c_thecat]['0'] = 'checked';
		}
		$c_output = "<tr";
		if ($tr_count%2>0) {
			$c_output = $c_output." class='alternate'";
		}
		
		$c_output = $c_output."><td>";
		$pad="";
		for($i=0; $i < $c_indent; $i++) { // was < $c_new_l
			$pad = $pad." &#8250;&nbsp;&nbsp;";
		}
		if($meta_old['cat'.$c_thecat]['limit_to'] == '0') {
			$meta_old['cat'.$c_thecat]['limit_to'] ='';
		}
		$c_output = $c_output.$c_thecat.
		
		'</td><td>'.$pad.'<a href="?page=astickypostorderer&cat='.$c_thecat.'">'.$row[name].
		//'</td><td>'.$row[description].
		'</td><td style="text-align: center"><input name="cat'.$c_thecat.'" type="radio" value="1" '.$meta_old['cat'.$c_thecat]["1"].'>
			<input name="cat_limit'.$c_thecat.'" type="text" size="3" maxlength="3" value='.$meta_old['cat'.$c_thecat]['limit_to'].'>
		 </td><td style="text-align: center"><input name="cat'.$c_thecat.'" type="radio" value="2" '.$meta_old['cat'.$c_thecat]["2"].'>
		 </td><td style="text-align: center"><input name="cat'.$c_thecat.'" type="radio" value="0" '.$meta_old['cat'.$c_thecat]["0"].'>
		 </td><td style="text-align: center"><input name="cat'.$c_thecat.'" type="radio" value="4" '.$meta_old['cat'.$c_thecat]["4"].'>
		 </td><td style="text-align: center">'.c_cat_sorties($c_thecat).' / '.$row[count].
		'</td></tr>';
		echo $c_output;
		$cat_id=$row[term_id];
		$tr_count++;
		$tr_count = croer_feth_for_parent($cat_id,$c_indent+1, $tr_count, $meta_old);
	}
	return $tr_count;
}
function croer_get_cats_in_sql($c_parent, $c_taxtype) {
	global $wpdb;
	
	$query= "SELECT * ".
	 "FROM $wpdb->term_taxonomy LEFT JOIN $wpdb->terms ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id ".
	 "WHERE parent = $c_parent AND taxonomy = '$c_taxtype'  ".
	 "ORDER BY $wpdb->term_taxonomy.term_id ASC "; // AND count > 0 - eventually have Option based exclude
	 //echo "<br>".$query;
	 return mysql_query($query);
}
function c_cat_sorties($c_thecat) {
	global $wpdb;
	$cq_sorties = "SELECT * ".
	"FROM ".$wpdb->prefix."croer_posts ".
	"WHERE cat_id = $c_thecat ";
	
	$sorties = mysql_query($cq_sorties);
	$sortie_count = mysql_numrows($sorties);
	
	return $sortie_count;

}
?>