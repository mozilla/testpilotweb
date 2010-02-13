<?php
/*
Plugin Name: Top Level Categories
Plugin URI: http://fortes.com/projects/wordpress/top-level-cats/
Description: Removes the prefix from the URL for a category. For instance, if your old category link was <code>/category/catname</code> it will now be <code>/catname</code>
Version: 1.0.1
Author: Filipe Fortes
Author URI: http://fortes.com/  
*/

// In case we're running standalone, for some odd reason
if (function_exists('add_action'))
{
	register_activation_hook(__FILE__, 'top_level_cats_activate');
	register_deactivation_hook(__FILE__, 'top_level_cats_deactivate');

	// Setup filters
	add_filter('category_rewrite_rules', 'top_level_cats_category_rewrite_rules');
	add_filter('generate_rewrite_rules', 'top_level_cats_generate_rewrite_rules');
	add_filter('category_link', 'top_level_cats_category_link', 10, 2);
	
	global $clean_category_rewrites, $clean_rewrites;
	$clean_category_rewrites = array();
}

function top_level_cats_activate()
{
	global $wp_rewrite;
	$wp_rewrite->flush_rules();
}

function top_level_cats_deactivate()
{
	// Remove the filters so we don't regenerate the wrong rules when we flush
	remove_filter('category_rewrite_rules', 'top_level_cats_category_rewrite_rules');
	remove_filter('generate_rewrite_rules', 'top_level_cats_generate_rewrite_rules');
	remove_filter('category_link', 'top_level_cats_category_link');

	global $wp_rewrite;
	$wp_rewrite->flush_rules();
}

function top_level_cats_generate_rewrite_rules($wp_rewrite)
{
	global $clean_category_rewrites;
	$wp_rewrite->rules = $wp_rewrite->rules + $clean_category_rewrites;
}

function top_level_cats_category_rewrite_rules($category_rewrite)
{
	global $clean_category_rewrites;

  global $wp_rewrite;
  // Make sure to use verbose rules, otherwise we'll clobber our
  // category permalinks with page permalinks
  $wp_rewrite->use_verbose_page_rules = true;

	while (list($k, $v) = each($category_rewrite)) {
		// Strip off the category prefix
		$new_k = top_level_cats_remove_cat_base($k);
		$clean_category_rewrites[$new_k] = $v;
	}

	return $category_rewrite;
}

function top_level_cats_category_link($cat_link, $cat_id)
{
	return top_level_cats_remove_cat_base($cat_link);
}

function top_level_cats_remove_cat_base($link)
{
	$category_base = get_option('category_base');
	
	// WP uses "category/" as the default
	if ($category_base == '') 
		$category_base = 'category';

	// Remove initial slash, if there is one (we remove the trailing slash in the regex replacement and don't want to end up short a slash)
	if (substr($category_base, 0, 1) == '/')
		$category_base = substr($category_base, 1);

	$category_base .= '/';

	return preg_replace('|' . $category_base . '|', '', $link, 1);
}
?>
