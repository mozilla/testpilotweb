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
    <link rel="stylesheet" type="text/css" media="all" href="http://testpilot.mozillalabs.com/universal/univ-mozlab-style.css">
    <link rel="stylesheet" href="http://testpilot.mozillalabs.com/js/css/lightbox.css" type="text/css" media="screen" />
    <link rel="icon" href="http://testpilot.mozillalabs.com/images/favicon.ico">
    <script type="text/javascript" src="http://testpilot.mozillalabs.com/s_code.js"></script>
    <script type="text/javascript" src="http://testpilot.mozillalabs.com/js/prototype.js"></script>
    <script type="text/javascript" src="http://testpilot.mozillalabs.com/js/scriptaculous.js?load=effects,builder"></script>
    <script type="text/javascript" src="http://testpilot.mozillalabs.com/js/lightbox.js"></script>
    <link rel="stylesheet" type="text/css" media="all" href="/css/screen.css" />
    <link rel="stylesheet" type="text/css" media="all" href="/css/subpage.css" />
    <link href="<?php bloginfo('stylesheet_url'); ?>" rel="stylesheet" type="text/css" media="screen">
		<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
		<?php if ( is_singular() ) wp_enqueue_script( 'comment-reply' ); ?>
		<?php wp_head(); ?>

	</head>
	
	<body <?php body_class(); ?>>

<div id="uni-header">

    <div id="topnav">

            <h1 id="logo"><a href="http://www.mozillalabs.com/" title="Mozilla Labs homepage"><img src="http://mozillalabs.com/wp-content/themes/labs2.0/img/labs-logo.png" alt="labs-logo" width="161" height="34"></a></h1>

            <ul id="mainnav">
                <li><a href="http://www.mozillalabs.com/projects/">All Labs Projects</a></li>
                <li><a href="http://www.mozillalabs.com/get-involved/">Get Involved</a></li>

            </ul>

    </div> <!-- END topnav -->

</div>


<div id="uni-subheader">

    <div id="subnav">

            <img class="sideLogo" src="http://mozillalabs.com/wp-content/themes/labs_project/img/testpilot-header.png">

            <div id="uni-subheader-title">Test Pilot</div>


            <ul id="pagenav">
                <li><a href="https://testpilot.mozillalabs.com/">Home</a></li>
                <li><a href="https://testpilot.mozillalabs.com/principles.php">Guiding Principles</a></li>
                <li><a href="http://www.mozillalabs.com/testpilot/">Blog</a></li>
                <li><a href="https://testpilot.mozillalabs.com/privacy.php">Privacy Policy</a></li>
                <li><a href="https://testpilot.mozillalabs.com/faq.php">FAQ</a></li>
                <li><a class="menu-highlight" href="https://testpilot.mozillalabs.com/testcases/">All Test Cases</a></li>

            </ul>

    </div>

</div>

<div id="uni-content">

    <!-- / / / / / / / / / / / / OPTIONAL PROJECT DOWNLOAD BAR / / / / / / / / / / / / -->

    <div class="uni-download uni-top-bar">
        <div class="content950">
            <h1>Try it now!</h1>

            <div class="uni-download-button"><a href="https://addons.mozilla.org/services/install.php?addon_id=testpilot">Download Test Pilot</a></div>
            <p>What are you waiting for? Become a Test Pilot and help us make Firefox better!</p>
        </div>
    </div>

        <div id="container">

