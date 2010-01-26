<?php require_once("../../../wp-config.php"); ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<title>aStickyPostOrderER</title>
<link rel="stylesheet" href="<?php bloginfo('stylesheet_url'); ?>" type="text/css" media="screen" />
<meta name="Keywords" content="WordPress, AndreSC, AndreClements, order, sticky, posts, category, tag, CMS, Content Management System, admin, stickiness " />
<meta name="Description" content="This WordPress plugin lets you order how posts are shown per category, per tag, or over-all, in WordPress blog." />
</head>
<body>
<div align="left" style="width:50em; margin: 0 auto">
  <h1>=== <a href="http://pixelplexus.co.za/blog/2007/11/20/plugin-to-change-wordpress-post-order/">AStickyPostOrderER</a> ===</h1>
  <h2>== Information == </h2>
  <p><br />
    Contributors: <a href="http://andreclements.com">AndreSC</a> <br />
    Donate link: <a href="http://www.dreamhost.com/donate.cgi?id=8872">donate towards hosting fees.</a><br />
    Tags: order, sticky, posts, category, tag, CMS, Content Management System, admin, stickiness <br />
    Requires at least: 2.3<br />
    Tested up to: 2.8.4<br />
    Stable tag: 0.3</p>
  <p>This WordPress plugin lets you order how posts are shown per category, per tag, or over-all, in WordPress 2.3+ blog as Content Management System. Now with meta-stickiness!<br />
  </p>
  <h2>== Description ==</h2>
  <p>AStickyPostOrderER lets you customize the order in which posts are displayed per category, per tag, or over-all, in WordPress 2.3+ blog. </p>
  <p>Useful when using WordPress as a Content Management System. </p>
  <p>Now with category or tag based meta-stickiness!</p>
  <h2>= How to: =</h2>
  <p>Once the plugin is installed, go to &quot;Manage&quot;, &quot;AStickyPostOrderER&quot;.</p>
  <p>The plugin displays a list of your categories as well as a list of tags in use. <br />
    The category and tag names are links (used to make 'Sorties') each followed by radio buttons and a Limit field. </p>
  <p>Sorties: Click a category or tag's name below to manually create an order of some or all of its contained posts to be shown before the default ordered posts in that category or tag, or re-arange all posts as they apear on home(index) and archive pages.</p>
  <p>(Please Note: You have to individually set order for each category or sub category you want to order a sticky post in, if enough people express it as a requirement I'll add functionality for the plugin to propagate order set in the index view to either all- or specific categories tags. Mail me if you need this.)</p>
  <p> AND / OR </p>
  <p>Meta: Use the radio buttons to specify meta-stickyness, respectively: </p>
  <p>1. Super-sticky: Show before anything else (you can set a limit for how many posts from this cat or tag should be given this preferential treatment, e.g. if you want the latest post with the tag 'events' to show before anything else in any category listing that contains that post place 1 in the textfield next to the 'events' tag and set it's radio button set to 'Super-sticky' )</p>
  <p>2. Sub-sticky: Show after individually ordered posts ('Sorties') for given view but before un-sorted posts</p>
  <p>3. Default: Treat normally (except for individually ordered posts)</p>
  <p>4. Droppy: Show only after everything else<br />
    and remember to click 'update meta-stickyness' at the bottom of the page for your changes to, ahemmm, 'stick' . . .<br />
  </p>
  <h2>== Installation ==</h2>
  <p>1. Upload the `AStickyPostOrderER` folder and its content to the `/wp-content/plugins/` directory<br />
    2. Activate the plugin through the 'Plugins' menu in WordPress<br />
    3. In the admin panel, go to Manage, AStickyPostOrderER the rest is explained right there.<br />
  </p>
  <h2>== <a href="http://wordpress.org/extend/plugins/astickypostorderer/screenshots/">Screenshots</a> ==</h2>
  <p>1. The main screen where you can define mate-stickiness or select a category or tag..<br />
    2. that will open in a new screen where you can manually arrange the order of posts.</p>
  <h2>== Changelog ==<br />
  </h2>
  <p>2.2.8 (2008/04/28) <br />
    * Fixed parent categories not showing order in WordPress 2.5<br />
    * Fixed weirdness previously resulting from removing posts from being ordered<br />
    * Created this index.php page (noticed content of plugin folder indexed on Google</p>
  <p>&nbsp;</p>
  <?php ?>
  <p>Return to host site: </p>
  <h2><a href="<?php echo get_option('home'); ?>/"><?php bloginfo('name'); ?></a></h2>
		<div class="description"><?php bloginfo('description'); ?></div>
</div>
</body>
</html>
