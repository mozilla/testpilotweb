<?php
/**
 * @package WordPress
 * @subpackage TestPilot
 */
?>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>

	<head>
		<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php bloginfo('charset'); ?>" />
		<title><?php wp_title('&laquo;', true, 'right'); ?> <?php bloginfo('name'); ?></title>
  <link rel="stylesheet" type="text/css" media="all" href="/css/screen.css" />
  <link rel="stylesheet" type="text/css" media="all" href="/css/subpage.css" />
<link href="<?php bloginfo('stylesheet_url'); ?>" rel="stylesheet" type="text/css" media="screen">
		<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
		<?php if ( is_singular() ) wp_enqueue_script( 'comment-reply' ); ?>
		<?php wp_head(); ?>
	</head>
	
	<body <?php body_class(); ?>>

  <div id="container" class="group">
    <div id="logo"><a href="http://labs.mozilla.com">
       <img src="/images/logo.png" alt="Mozilla Labs"></a>
    </div>
	<div class="button">
		<span class="menuItem"><a href="/index.html">Home</a></span>
<?php if (is_home()) { ?>
   		<span class="menuOn"><a href="/testcases/">Test Cases</a></span>
<?php } else { ?> 
		<span class="menuItem"><a href="/testcases/">Test Cases</a></span>
<?php } ?>
		<span class="menuItem"><a href="/principles.html">Guiding Principles</a></span>
        <span class="menuItem"><a href="/faq.html">FAQ</a></span>
		<span class="menuItem"><a href="/privacy.html">Privacy Policy</a></span>
      </div>
    <div id="content">
