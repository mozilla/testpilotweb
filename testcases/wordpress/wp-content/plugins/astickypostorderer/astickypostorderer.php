<?php
/*
Plugin Name: AStickyPostOrderER
Plugin URI: http://pixelplexus.co.za/blog/2007/11/20/plugin-to-change-wordpress-post-order/
Description: AStickyPostOrderER lets you customize the order in which posts are displayed per category, per tag, or over-all, in WordPress 2.3+ blog. Useful when using WordPress as a Content Management System. Now with pagination of post lists. 
Author: AndreSC
Version: 0.3 
Author URI: http://pixelplexus.co.za/
*/
/*  Copyright 2007 André Clements  (email : andre@pixelplexus.co.za)

    This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License 
	as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.
    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with this program; 
	if not, write to the Free Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


//Main stuff

add_filter('posts_request','croer_the_sort');
// Insert the croer_add_pages() sink into the plugin hook list for 'admin_menu'
add_action('admin_menu', 'croer_add_pages');
// create DB
//add_action('activate_aStickyPostOrderER/astickypostorderer.php', 'croer_install');
register_activation_hook( plugin_basename(__FILE__), 'croer_install' );
// mention  in head
add_action('wp_head', 'croer_version');
add_action('delete_post', 'croer_delete');

//

// croer_add_pages() is the sink function for the 'admin_menu' hook
function croer_add_pages() {
       // Add a new menu under Manage:
    add_management_page('AStickyPostOrderER', 'AStickyPostOrderER', 8, 'astickypostorderer', 'astickypostorderer_page');
}

// mt_manage_page() displays the page content for the CROER submenu
function astickypostorderer_page() {
	require_once('croer-functions.php');
	require_once(ABSPATH . 'wp-admin/admin-functions.php');
	require_once(ABSPATH . 'wp-includes/formatting.php');
	global $cat, $croer;
	if (isset($_GET['cat'])) {
		$cat = stripslashes($_GET['cat']);
	}
	if (isset($_GET['croer'])) {
		$croer = stripslashes($_GET['croer']);
	}
	echo "<div class=\"wrap\">		<h2>AStickyPostOrderER</h2>";
	//echo "<!-- cat=".$cat." croer=".$croer.") -->";
	if ($croer) {
		// we are returning here with a bit of work to do
		switch($croer) {
			case 1:
				echo "<!-- updating per cat or tag -->\n";
				require_once('croer-transact.php');
				break;
			case 2:
				echo "<!-- updating all meta stickyness -->\n";
				require_once('croer-meta-transact.php');
				break;
		}
	}
	if ($cat == NULL) {
		//  no cat in hand thus start by giving choice of categories";
		_e("<p><strong>Sorties</strong>: Click a category or tag's name below to manually create an order of some or all of its contained posts to be shown before the default ordered posts in that category or tag, or <a href='?page=astickypostorderer&cat=0'>
		re-arange all posts</a> as they apear on home and archive pages.<br>
		 - <strong><em>AND / OR</em></strong> - <br><strong>Meta</strong>: Use the radio buttons to specify meta-stickyness, respectively:
		<ol>
			<li>Super-sticky: Show before anything else<br> (you can set a limit for how many posts from this cat or tag should be given this preferential treatment)</li>
			<li>Sub-sticky: Show after individually ordered posts for given view but before on-sorted posts</li>
			<li>Default: Treat normally (except for individually ordered posts)</li>
			<li>Droppy: Show only after everything else</li>
			
		</ol>
		and remember to click  'update meta-stickyness' at the bottom of this page for your changes to, ahemmm, &apos;stick&apos;&#8230; <br>
		<br> ");
		echo '<a href="?page=astickypostorderer&cat=0">';
		_e('Order Index, Archive and Search Results Order');
		echo '</a>';
		echo ' | <a href="http://pixelplexus.co.za/blog/2007/11/20/plugin-to-change-wordpress-post-order/" target="_blank">';
		_e('Learn More');
		echo '</a>';
		echo ' | <a href="http://www.dreamhost.com/donate.cgi?id=8872" target="_blank">';
		_e('Please Donate');
		echo '</a>';
		_e(' | Problems or sugestions&#8230;? mail me at <a href="mailto:andre@pixelplexus.co.za">andre@pixelplexus.co.za</a></p> ');
		$meta_old = croer_get_meta();
		?>
		<form action="?page=astickypostorderer&croer=2" method="post" target="_self" >
		
		<?php 
		if(!(($_POST['tagsearch'])||($_POST['tagpage']))){
			require_once('croer-listcats.php');?>
            <hr /><?php
		}
		require_once('croer-listtags.php');
		
		?>
		<br>
		<input name="submit" type="submit" value="update meta-stickyness" --> 
		</form><br>
		AStickyPostOrderER <?php croer_version() ?>
		<?php
	} else {
		//  show category posts to re-arange
		 ?>
		
		  <?php _e('<h4>Editing order of posts ');
		  	if ($cat==0) {
				_e(' in Index/Archive view');
			} else {
				_e(' in '.c_catname($cat));
			}
		  _e('</h4>'); ?>
		
		<p>Enter a position number (e.g. '1') in the text field to the right of any posts to send 
		the coresponding posts to that position. 		
		Enter '0' to remove that posts from the list of sorted posts.</p>
		<p>To affect these changes click 'Save and Refresh' beneath the list.</p>
		<?php
			present_posts($cat);
			echo "<br>or<br> <a href=\"?page=astickypostorderer\">Select a different category to re-order</a>.";
	}
}

// this modifies the query used to display posts on the front-end and on Manage Posts
function croer_the_sort($the_wp_query) {
	
	global $wp_query;
	//echo " -- the sort -- $the_wp_query \n<br><br>";
	//var_dump($wp_query);
	$c_query = $the_wp_query;
	
	if((!$wp_query->is_admin)&&(!$wp_query->is_single)&&(!$wp_query->is_page)) {
		//echo "<!-- do sort -->";
		
		global $wpdb;
		if((is_category())||(is_tag())) { 
			//echo "Cat!!!"; 
			global $wp_query;
			$current_term_id = $wp_query->get_queried_object_id();
		} else {
			//echo "NOT Cat!!!";
		}
		//echo "<br>original: <br>".$c_query." <br>";
		// - - - - 
		// ar $meta_posts_list defines meta sticky filters for ordering the query results
		// $meta_posts_list['1'] ... rank1
		$meta_posts_list = array();
		$get_meta_terms_sql = "SELECT term_id, limit_to, term_type FROM ".$wpdb->prefix."croer_meta WHERE term_rank =1";
		$result_meta_terms = mysql_query($get_meta_terms_sql);
		if($result_meta_terms) {
			while($c_row = mysql_fetch_array($result_meta_terms)) {
				//print_r($c_row);
				extract($c_row);
				if ($limit_to >0) {
					$limiter = "LIMIT 0, $limit_to ";
				} else {
					$limiter = "";
				}
				if ($term_type == 'cat') { $c_type = 'category'; }
				if ($term_type == 'tag') { $c_type = 'post_tag'; }
				
				$c_meta_term_posts_sql = "SELECT ID FROM ".$wpdb->prefix."posts LEFT JOIN ".$wpdb->prefix."term_relationships ON ( ID = object_id ) LEFT JOIN ".$wpdb->prefix."term_taxonomy ON ( ".$wpdb->prefix."term_relationships.term_taxonomy_id = ".$wpdb->prefix."term_taxonomy.term_taxonomy_id ) LEFT JOIN ".$wpdb->prefix."croer_meta ON ( ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."croer_meta.term_id ) WHERE ".$wpdb->prefix."croer_meta.term_id = '$term_id' AND ".$wpdb->prefix."term_taxonomy.taxonomy = '$c_type' $limiter";
				
				///asc put in order by CRoer, post date DESC
				$result_meta_posts = mysql_query($c_meta_term_posts_sql);
				while ($c_meta_post = mysql_fetch_array($result_meta_posts)) {
					//echo "...".$c_meta_post['ID'];
					$meta_posts_list['1'][] = $c_meta_post['ID'];
				}
			}
		}
		//echo "<br><br> meta post list = ";
		//print_r($meta_posts_list['1']);
		if ($meta_posts_list['1']) {
			$c_ranks1 = ', '.$wpdb->prefix.'posts.ID IN '."('".join($meta_posts_list['1'], "','")."')".' AS rank1 ';
			$c_rank1_o = 'rank1 DESC, ';
		} else {
			$c_ranks1 = NULL;
			$c_rank1_o = '';
		}
		//echo "<br> c_ranks1=".$c_ranks1."<br>";
	// - - - - - - - - -- - --- - - - - - - - -
		$get_meta_terms_sql = "SELECT term_id, term_type FROM ".$wpdb->prefix."croer_meta WHERE term_rank = 2";
		$result_meta_terms = mysql_query($get_meta_terms_sql);
		if($result_meta_terms){
			while($c_row = mysql_fetch_array($result_meta_terms)) {
				extract($c_row);
				if ($term_type == 'cat') { $c_type = 'category'; }
				if ($term_type == 'tag') { $c_type = 'post_tag'; }
				$c_meta_term_posts_sql = "SELECT ID FROM ".$wpdb->prefix."posts LEFT JOIN ".$wpdb->prefix."term_relationships ON ( ID = object_id ) LEFT JOIN ".$wpdb->prefix."term_taxonomy ON ( ".$wpdb->prefix."term_relationships.term_taxonomy_id = ".$wpdb->prefix."term_taxonomy.term_taxonomy_id ) LEFT JOIN ".$wpdb->prefix."croer_meta ON ( ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."croer_meta.term_id ) WHERE ".$wpdb->prefix."croer_meta.term_id = '$term_id' AND ".$wpdb->prefix."term_taxonomy.taxonomy = '$c_type' ";
				$result_meta_posts = mysql_query($c_meta_term_posts_sql);
				while ($c_meta_post = mysql_fetch_array($result_meta_posts)) {
					//echo "...".$c_meta_post['ID'];
					$meta_posts_list['2'][] = $c_meta_post['ID'];
				}
			}
		}
		//echo "<br><br> meta2 post list = ";
		//print_r($meta_posts_list['2']);
		if ($meta_posts_list['2']) {
			$c_ranks2 = ', '.$wpdb->prefix.'posts.ID IN '."('".join($meta_posts_list['2'], "','")."')".' AS rank2 ';
			$c_rank2_o = 'rank2 DESC, ';
		} else {
			$c_ranks2 = NULL;
			$c_rank2_o = '';
		}
		// - - - - - - - - -- - --- - - - - - - - -
		$get_meta_terms_sql = "SELECT term_id, term_type FROM ".$wpdb->prefix."croer_meta WHERE term_rank = 4";
		$result_meta_terms = mysql_query($get_meta_terms_sql);
		if($result_meta_terms){
			while($c_row = mysql_fetch_array($result_meta_terms)) {
				extract($c_row);
				if ($term_type == 'cat') { $c_type = 'category'; }
				if ($term_type == 'tag') { $c_type = 'post_tag'; }
				$c_meta_term_posts_sql = "SELECT ID FROM ".$wpdb->prefix."posts LEFT JOIN ".$wpdb->prefix."term_relationships ON ( ID = object_id ) LEFT JOIN ".$wpdb->prefix."term_taxonomy ON ( ".$wpdb->prefix."term_relationships.term_taxonomy_id = ".$wpdb->prefix."term_taxonomy.term_taxonomy_id ) LEFT JOIN ".$wpdb->prefix."croer_meta ON ( ".$wpdb->prefix."term_taxonomy.term_id = ".$wpdb->prefix."croer_meta.term_id ) WHERE ".$wpdb->prefix."croer_meta.term_id = '$term_id' AND ".$wpdb->prefix."term_taxonomy.taxonomy = '$c_type' ";
				$result_meta_posts = mysql_query($c_meta_term_posts_sql);
				while ($c_meta_post = mysql_fetch_array($result_meta_posts)) {
					//echo "...".$c_meta_post['ID'];
					$meta_posts_list['4'][] = $c_meta_post['ID'];
				}
			}
		}
		//echo "<br><br> meta4 post list = ";
		//print_r($meta_posts_list['4']);
		if ($meta_posts_list['4']) {
			$c_ranks4 = ', '.$wpdb->prefix.'posts.ID IN '."('".join($meta_posts_list['4'], "','")."')".' AS rank4 ';
			$c_rank4_o = 'rank4 ASC, ';
		} else {
			$c_ranks4 = NULL;
			$c_rank4_o = '';
		}
		
		
		
		$c_into = strpos($c_query, "FROM ");
		$c_query = substr_replace($c_query, $c_ranks1.', '.$wpdb->prefix.'croer_posts.post_rank IS NULL AS isnull '.$c_ranks2.$c_ranks4 , $c_into, 0);
		$c_into = strpos($c_query, "WHERE ");
		if (strpos($c_query, "$wpdb->term_taxonomy.term_id")) {
			//echo "<br>if<br>";
			$c_query = substr_replace($c_query,
										 'LEFT JOIN '.$wpdb->prefix.'croer_posts ON ('.$wpdb->posts.'.ID = '.$wpdb->prefix.'croer_posts.post_id     AND '.$wpdb->prefix.'croer_posts.cat_id = '.$current_term_id.') ',
										  $c_into, 0);// AND '.$wpdb->term_taxonomy.'.term_id = '.$wpdb->prefix.'croer_posts.cat_id AND
		} else {
			//echo "<br>else<br>";
			$c_query = substr_replace($c_query, 'LEFT JOIN '.$wpdb->prefix.'croer_posts ON ('.$wpdb->posts.'.ID = '.$wpdb->prefix.'croer_posts.post_id AND '.$wpdb->prefix.'croer_posts.cat_id = 0) ', $c_into, 0);
		}
		$c_into = strpos($c_query, "ORDER BY ")+9;
		$c_query = substr_replace($c_query, "$c_rank1_o isnull ASC, ".$wpdb->prefix."croer_posts.post_rank ASC, $c_rank2_o$c_rank4_o", $c_into, 0);
		
		//echo "<br>edited: <br>".$c_query." <br>";
		
	}
	//echo "\n<br><br>$c_query\n<br><br";
	return $c_query;
}

//DB
$croer_db_version = "1.2";
$croer_metadb_version = "1.2";

function croer_install() {
   global $wpdb;
   global $croer_db_version;
   global $croer_metadb_version;
   $table_name = $wpdb->prefix."croer_posts";
   $meta_table_name = $wpdb->prefix."croer_meta";
   // if create from scratch
   // this orders POSTS by cat or tag
   $sql = "CREATE TABLE " . $table_name . " (
			croer_id bigint( 20 ) NOT NULL AUTO_INCREMENT ,
			post_id bigint( 20 ) NOT NULL ,
			cat_id int( 10 ) NOT NULL ,
			post_rank bigint( 20 ) NOT NULL ,
			PRIMARY KEY croer_id( croer_id )
		);";
	// Meta-stick: this makes an entire Cat or Tag Super-sticky, sub-sticky or droppy
	// 1= before stickys, 2= after but before default, 3= after everything else
	$meta_sql = "CREATE TABLE " . $meta_table_name . " (
			cmeta_id bigint( 20 ) NOT NULL AUTO_INCREMENT ,
			term_id int( 10 ) NOT NULL ,
			term_rank int( 3 ) NULL ,
			limit_to int( 3 ) NULL ,
			term_type tinytext NULL,
			PRIMARY KEY  cmeta_id( cmeta_id )
		);";
		//?
	if(@is_file(ABSPATH.'/wp-admin/upgrade-functions.php')) {
		include_once(ABSPATH.'/wp-admin/upgrade-functions.php');
	} elseif(@is_file(ABSPATH.'/wp-admin/includes/upgrade.php')) {
		include_once(ABSPATH.'/wp-admin/includes/upgrade.php');
	} else {
		die('We have problem finding your \'/wp-admin/upgrade-functions.php\' and \'/wp-admin/includes/upgrade.php\'');
	}
	//?
   if($wpdb->get_var("show tables like '$table_name'") != $table_name) {
      require_once(ABSPATH . 'wp-admin/upgrade-functions.php');
      dbDelta($sql);
      add_option("croer_db_version", $croer_db_version);
   }
   if($wpdb->get_var("show tables like '$meta_table_name'") != $meta_table_name) {
      require_once(ABSPATH . 'wp-admin/upgrade-functions.php');
      dbDelta($meta_sql);
      add_option("croer_metadb_version", $croer_metadb_version );
   }
   // in case of upgrading
   $installed_ver = get_option( "croer_db_version" );
   if( $installed_ver != $croer_db_version ) {
      require_once(ABSPATH . 'wp-admin/upgrade-functions.php');
      dbDelta($sql);
      update_option( "croer_db_version", $croer_db_version );
  }
  $installed_metaver = get_option( "croer_metadb_version" );
   if( $installed_metaver != $croer_db_version ) {
      require_once(ABSPATH . 'wp-admin/upgrade-functions.php');
	  dbDelta($meta_sql);
	  update_option( "croer_metadb_version", $croer_metadb_version );
  }
}

function croer_delete($deleted_post_id){
	// user just deleted post: $deleted_post_id, removing it from ordered posts as well
	global $wpdb;
	$sql = "DELETE FROM `".$wpdb->prefix."croer_posts` WHERE `".$wpdb->prefix."croer_posts`.`croer_id` = $deleted_post_id";
	$result = mysql_query($sql);
	// no error handeling for the time being, maybe later
}

function croer_version() {
	echo "\n <!-- AStickyPostOrderER (Version: 0.3) -->\n";
}
?>
