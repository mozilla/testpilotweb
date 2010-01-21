<?php // catreorderer functions
//echo "<!-- catreorderer functions -->";
?>
<?php 
function croer_get_meta() {
	global $wpdb;
 	$meta_result = mysql_query("SELECT * FROM ".$wpdb->prefix."croer_meta  ");
	$meta_old = array();
	if($meta_result) {
		while ($row = mysql_fetch_array($meta_result)) {
			//echo "fetch array:";
			//print_r($row);
			// init
			for($i = 1; $i <= 4; $i++) {
				$meta_old[$row['term_type'].$row['term_id']][$i] = '';
			}
			$meta_old[$row['term_type'].$row['term_id']][$row['term_rank']] = 'checked';
			$meta_old[$row['term_type'].$row['term_id']]['limit_to'] = $row['limit_to']; 
		}
	}
	//echo "meta old<br>";
	//print_r ($meta_old);
 	return $meta_old;
}

function croer_get_sorted($croer_cat) {
	global $wpdb;
	$query= "SELECT * ".
	 "FROM ".$wpdb->prefix."croer_posts ".
	 "LEFT JOIN $wpdb->posts ".
	 "ON ".$wpdb->prefix."croer_posts.post_id = $wpdb->posts.ID ".
	 "WHERE ".$wpdb->prefix."croer_posts.cat_id = $croer_cat ".
	 "ORDER BY ".$wpdb->prefix."croer_posts.post_rank ASC";
	//echo $query;?>

<br />
<?php
	 return mysql_query($query);
}
function croer_get_just_sorted($croer_cat) {
	global $wpdb;
	$query= "SELECT post_id, post_rank ".
	 "FROM ".$wpdb->prefix."croer_posts ".
	 "WHERE cat_id = $croer_cat ".
	 "ORDER BY ".$wpdb->prefix."croer_posts.post_rank ASC";
	
	 return mysql_query($query);
}


function present_posts($croer_cat) {
	global $cat, $croer;
	//echo "croer_cat=".$croer_cat;
	$sorts = croer_get_sorted($croer_cat);
	//var_dump($sorts);
	 
	 $sorts_list = array();
	  ?>
<form action="?page=astickypostorderer&croer=1&cat=<?php echo $croer_cat; ?>" method="post" target="_self">
  <?php
$limit = $_POST['set_limit'];
$soffset = $_POST['p_soffset'];
$usoffset = $_POST['p_usoffset'];
if(!$limit) $limit = 30;
if(!$soffset) $soffset = 0;
if(!$usoffset) $usoffset = 0;
if($_GET['l']) $limit = $_GET['l'];
if($_GET['s']) $soffset = $_GET['s'];
if($_GET['u']) $usoffset = $_GET['u'];
if($usoffset<0) $usoffset = 0;
if($soffset<0) $soffset = 0;
if($limit<1) $limit = 1;

?>
  <input name="p_soffset" type="hidden" value="<?php echo $soffset;?>" />
  <input name="p_usoffset" type="hidden" value="<?php echo $usoffset;?>" />
  <?php
if(!$limit) $limit = 30;?>
  <p>Limit lists to
    <input name="set_limit" type="text" value="<?php if($limit) echo $limit;?>" size="3" maxlength="3" />
    records (default = 30).</p>
  <table class="widefat">
    <thead>
      <tr>
        <th width="50" scope="col">Position</th>
        <th width="50" style="text-align: center" scope="col">ID</th>
        <th scope="col">Title</th>
        <th width="100" scope="col">Send To</th>
      </tr>
    </thead>
    <tbody id="asc-list">
      <tr>
        <td colspan="4" style='text-align: left'><hr>
          <strong>Sorted:</strong></td>
      </tr>
      <?php
    $placecount = 0;
	$stotalcount = 0;		
	 while ($row = mysql_fetch_array($sorts)) {
	 	extract($row);
		//var_dump($row);
		if(($stotalcount>=$soffset)&&($placecount<$limit)){
			$placecount++;
			showrow($placecount+$soffset, $ID, $post_title, $post_name, $guid);
			$sorts_list[$placecount-1] = $ID;
		}
	 	$stotalcount++;
	 }?>
    <tr>
      <td colspan="4"><?php 
	  if ($placecount){
			?>Records <?php echo $soffset+1;?> to <?php echo $soffset + $placecount;?> of <?php echo $stotalcount;?> found.<br />
			<?php
			if($soffset>0) {
				?><a href="?page=astickypostorderer&amp;cat=<?php echo $cat;?>&amp;l=<?php echo $limit?>&amp;s=<?php echo $soffset-$limit ?>&amp;u=<?php echo $usoffset ?>">Previous</a><?php
			} else {?>
        		Previous<?php 
			}?>
        	|
			<?php if($soffset + $placecount < $stotalcount) { 
				?>
            	<a href="?page=astickypostorderer&amp;cat=<?php echo $cat;?>&amp;l=<?php echo $limit?>&amp;s=<?php echo $soffset+$limit ?>&amp;u=<?php echo $usoffset ?>">Next</a>
            	<?php 
        	} else { ?>
            	Next<?php 
			}
		} else {?>No Records found.<?php }?></td>
    </tr>
    <?php
	 // include posts in 'child' categories
	 array();
	$c_cat_and_subcats = "($croer_cat".get_category_children($croer_cat,',','').")";
	global $wpdb;
	if ( $croer_cat != 0) {
		//  Cat
	 	$query= "SELECT * ".
	 	"FROM $wpdb->posts JOIN ($wpdb->term_relationships, $wpdb->term_taxonomy) ".
		"ON ($wpdb->posts.ID = $wpdb->term_relationships.object_id AND $wpdb->term_relationships.term_taxonomy_id = $wpdb->term_taxonomy.term_taxonomy_id) ".
		"WHERE  $wpdb->term_taxonomy.term_id IN $c_cat_and_subcats AND post_type = 'post'";
		//echo "br>".$query;
	} else {
		// not cat
		$query= "SELECT * ".
	 	"FROM $wpdb->posts JOIN ($wpdb->term_relationships, $wpdb->term_taxonomy) ".
		"ON ($wpdb->posts.ID = $wpdb->term_relationships.object_id AND $wpdb->term_relationships.term_taxonomy_id = $wpdb->term_taxonomy.term_taxonomy_id) ".
		"WHERE  post_type = 'post'";
	}
	 
	 $query.="ORDER BY ID DESC ;";
	// echo "<br>Q:".$query;
	 $result = mysql_query($query);
	 
	 ?>
    <tr>
      <td colspan="4" style='text-align: left'><hr>
        <strong>Un-sorted:</strong></td>
    </tr>
    <?php
  $unsorts_shown = array();
  $placecount = 0;
  $ustotalcount=0;
	 while ($row= mysql_fetch_array($result)) {
	 	extract($row);
		
		if ((!in_array($ID, $sorts_list))&&(!in_array($ID, $unsorts_shown))) {
			$unsorts_shown[] = $ID;
			if(($ustotalcount>=$usoffset)&&($placecount<$limit)){
				$placecount++;
				showrow($placecount+$usoffset, $ID, $post_title, $post_name, $guid);
				
				
			}
			$ustotalcount++;
		} 	
	 } 
	 ?>
    <tr>
      <td colspan="4"><?php
      if ($placecount){?>
          Records <?php echo $usoffset+1;?> to <?php echo $usoffset + $placecount;?> of <?php echo $ustotalcount;?> found.<br />
            <?php
            if($usoffset>0) {?>
            	<a href="?page=astickypostorderer&amp;cat=<?php echo $cat;?>&amp;l=<?php echo $limit?>&amp;s=<?php echo $soffset ?>&amp;u=<?php echo $usoffset-$limit ?>">Previous</a><?php
            } else {?>
            	Previous<?php 
			}?>
            |<?php 
			if($usoffset + $placecount < $ustotalcount) { ?>
            	<a href="?page=astickypostorderer&amp;cat=<?php echo $cat;?>&amp;l=<?php echo $limit?>&amp;s=<?php echo $soffset ?>&amp;u=<?php echo $usoffset+$limit ?>">Next</a><?php 
        	} else { ?>
            	Next<?php 
			}
   	} else {?>No Records found.<?php }?>
    </td>
    </tr>
    <tr>
      <td colspan="4"><input name="croer_cat" type="hidden" value="<?php echo $croer_cat; ?>">
        <input name="submit" type="submit" value="Save and Refresh"></td>
    </tr>
    </tbody>
    
  </table>
</form>
<br>
<?php
} 
function showrow($placecount, $ID, $post_title, $post_name, $guid) {
	echo "<tr";
	if ($placecount%2>0) {
		echo " class='alternate'";
	}
	echo ">";
	echo "<th scope='row' style='text-align: center'>".$placecount."</th>";
	echo "<td style=\"text-align: center\">".$ID."</td>";
	//echo "<td><a href=\"http://www.davidkrutpublishing.com/dkp/?p=".$ID."\" title=\"".$post_name."\" target=\"_blank\">".$post_title."</a></td>";
	echo "<td><a href=\"".$guid."\" title=\"".$post_name."\" target=\"_blank\">".$post_title."</a></td>";
	echo "<td><input name=\"pid".$ID."\" type=\"text\" size=\"5\" maxlength=\"5\">"."</td>";
	echo "</tr>";
}
//


function c_catname($cat) {/*
	global $wpdb;
	$cat_sql= "SELECT name ".
		"FROM $wpdb->term_taxonomy LEFT JOIN $wpdb->terms ".
		"ON $wpdb->term_taxonomy.term_id = $wpdb->terms.term_id ".
		"WHERE $wpdb->terms.term_id = $cat ";
	
	
	
	$cat_result = mysql_query($cat_sql);
	while ($row= mysql_fetch_array($cat_result)) {
		extract($row);
		return $name;
	}*/
}
?>
