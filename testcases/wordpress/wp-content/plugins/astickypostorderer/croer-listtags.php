<?php 
// list choice of tags for which to re arrange posts
?>

<h3><?php _e('Tags') ?></h3>
<div id="tagsearch">	
   	<p>Search for tags like 
  	<input name="searchtag" type="text" value="<?php echo $_POST['searchtag'];?>" /> 
  	<input name="tagsearch" type="submit" value="Search" /></p>
    <?php 
	if($_POST['tagsearch']){
		$tagofset = '0';
	} else {
		if ($_POST['tagpage']=='previous'){
			$step = -1;
		} 
		if ($_POST['tagpage']=='next'){
			$step = 1;
		}
		$tagofset = intval( $_POST['tagofset']) + 10*$step;
	}
	$croer_tagslist = croer_tag_list($_POST['searchtag'],$tagofset); // was 'croer_cat_rows()' 
  	$croer_num_rows = count($croer_tagslist);
	$NORResult=mysql_query("Select FOUND_ROWS()"); 
	$NORRow=mysql_fetch_array($NORResult); 
	$NOR=$NORRow["FOUND_ROWS()"];
	?><p><?php 
	_e("Showing ");
	echo $croer_num_rows;
	_e(" of ");
	echo $NOR;
	_e (" tags. (Page ");
	echo $tagofset/10+1;
	_e (" of ");
	echo intval($NOR/10)+1;
	_e(" ) ");
	if($croer_num_rows<$NOR){
		//var_dump($_POST);?>
	    Go to <input name="tagofset" type="hidden" value="<?php echo $tagofset?>" />
        <?php
        if($tagofset){?>
        	<input name="tagpage" type="submit" value="previous" /><?php
		}
		if($tagofset<($NOR/2)){?>
        	<input name="tagpage" type="submit" value="next" /> 
            <?php
		}?>
        results.
        <?php
	}?></p>
</div>
<table class="widefat">
   <thead>
	<tr>
	  <th scope="col" style="text-align: center" rowspan="2"><?php _e('ID') ?></th>
	  <th scope="col" rowspan="2"><?php _e('Tag Name') ?></th>
	  <th scope="col" colspan="4" style="text-align: center"><?php _e('Meta-stickyness') ?></th>
	  <th scope="col" width="90" style="text-align: center" rowspan="2"><?php _e('sorted / in&nbsp;tag.') ?></th>
	</tr>
	<tr>
	  <th scope="col" style="text-align: center">Super-sticky [Limit]</th>
	  <th scope="col" style="text-align: center">Sub-sticky</th>
	  <th scope="col" style="text-align: center">Default</th>
	  <th scope="col" style="text-align: center">Droppy</th>
	</tr>
  </thead>
  <tbody id="tag-list"><tr><td>
  <?php
  $croer_started = false;
  foreach($croer_tagslist as $croer_tag) {
	if ($tr_count%2>0) {
			$c_rowstyle = " class='alternate'";
		} else {
			$c_rowstyle = "";
		}
	$croer_started = true;
  	$croer_tagid = $croer_tag[term_id];
	if((!$meta_old['tag'.$croer_tagid])||($meta_old['tag'.$croer_tagid] == 0)) {	$meta_old['tag'.$croer_tagid]['0'] = 'checked'; }
	if($meta_old['tag'.$croer_tagid]['limit_to'] == '0') { $meta_old['tag'.$croer_tagid]['limit_to'] = ''; }
  	$croer_item = " <tr $c_rowstyle><td>$croer_tagid</td><td>".
		"<a href=\"?page=astickypostorderer&cat=$croer_tagid\" title=\"$croer_tag[slug]\" >$croer_tag[name]</a></td><td style='text-align: center'>".
		//.
		"<input name='tag$croer_tagid' type='radio' value='1' ".$meta_old['tag'.$croer_tagid]['1']." >".
		"<input name='tag_limit$croer_tagid' type='text' size='3' maxlength='3' value='".$meta_old['tag'.$croer_tagid]['limit_to']."'></td><td style='text-align: center'>".
		"<input name='tag$croer_tagid' type='radio' value='2' ".$meta_old['tag'.$croer_tagid]['2']."></td><td style='text-align: center'>".
		"<input name='tag$croer_tagid' type='radio' value='0' ".$meta_old['tag'.$croer_tagid]['0']."></td><td style='text-align: center'>".
		"<input name='tag$croer_tagid' type='radio' value='4' ".$meta_old['tag'.$croer_tagid]['4']."></td><td style='text-align: center'>".
		" $croer_tag[sort_count]/$croer_tag[count]</td></tr>";
		echo $croer_item;
		$tr_count++;
  }
  ?>
  </tbody>
</table>

<?php  
function croer_tag_list($searchtag='',$tagofset=0) {
	if ($searchtag){
	?><tr><td colspan="8"><?php
		$croer_condition = "AND (name LIKE '%$searchtag%' OR slug LIKE '%$searchtag%') ";
	} else {
		$croer_condition = "";
	}
	?></td></tr><?php
	global $wpdb;
	$query= "SELECT SQL_CALC_FOUND_ROWS *, COUNT(post_rank) FROM $wpdb->term_taxonomy ".
		"LEFT JOIN $wpdb->terms ON ( $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id ) ".
		"LEFT JOIN ".$wpdb->prefix."croer_posts ON ( $wpdb->term_taxonomy.term_id =  ".$wpdb->prefix."croer_posts.cat_id) ".
		"WHERE taxonomy = 'post_tag' $croer_condition".
		//"AND count >1 ".
		"GROUP BY term_taxonomy_id ".
		"ORDER BY $wpdb->terms.name ASC LIMIT $tagofset,10 "; // 
	 //echo "<br>q: $query";
	 $result =  mysql_query($query);
	 $num_rows = mysql_num_rows($result);
	 $croer_tagslist = array();
	 $croer_tagcount=0;
	 while($row = mysql_fetch_array($result)) {
	 	//print_r($row);
		extract($row);
		//echo $cat_id."-".$name.$count.", ";
		$croer_tagcount++;
		$croer_tagslist[$croer_tagcount]['term_id'] = $term_id;
		$croer_tagslist[$croer_tagcount]['name'] = $name;
		$croer_tagslist[$croer_tagcount]['slug'] = $slug;
		$croer_tagslist[$croer_tagcount]['count'] = $count;
		$croer_tagslist[$croer_tagcount]['sort_count'] = $row['COUNT(post_rank)'];
		//print_r($croer_tagslist[$croer_tagcount]);
	 }
	 return $croer_tagslist;
}
?>
