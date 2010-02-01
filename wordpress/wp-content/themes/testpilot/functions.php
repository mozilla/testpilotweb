<?php
update_option('siteurl','http://testpilot-stage.mozillalabs.com/wordpress');
update_option('home','http://testpilot-stage.mozillalabs.com/wordpress');


/**
 * @package WordPress
 * @subpackage TestPilot
 */

automatic_feed_links();

if ( function_exists('register_sidebar') ) {
	register_sidebar(array(
		'before_widget' => '<li id="%1$s" class="widget %2$s">',
		'after_widget' => '</li>',
		'before_title' => '<h2 class="widgettitle">',
		'after_title' => '</h2>',
	));
}

/* list categories with posts by tugbucket.net :D */
function cat_and_posts(){
foreach (get_categories(array('hide_empty'=>true)) as $category)
{
$catid = $category->cat_ID;
global $post;
$myposts = get_posts('numberposts=100&category='.$catid);
echo '<li>' . $category->cat_name . "\n";
echo '<ul>' . "\n";
foreach($myposts as $post) {
echo '<li><a href="' . get_permalink() . '">' . get_the_title() . '</a></li>' . "\n";
}
echo '</ul>' . "\n";
echo '</li>' . "\n";
}
};
/* end */
?>
