=== AStickyPostOrderER ===
Contributors: AndreSC 
Donate link: http://www.dreamhost.com/donate.cgi?id=8872
Tags: order, sticky, posts, category, tag, CMS, Content Management System, admin, stickiness 
Requires at least: 2.3
Tested up to: 2.8.4
Stable tag: 0.3

Lets you order how posts are shown per category, per tag, or over-all, in WordPress weblog as Content Management System. 


== Description ==

AStickyPostOrderER lets you customize the order in which posts are displayed per category, per tag, or over-all, in WordPress 2.3+ blog. 

Useful when using WordPress as a Content Management System. 

Now with category or tag based meta-stickiness!

= How to: =

Once the plugin is installed, go to "Manage", "AStickyPostOrderER".

The plugin displays a list of your categories as well as a list of tags in use. 
The category and tag names are links (used to make 'Sorties') each followed by radio buttons and a Limit field. 

Sorties: Click a category or tag's name below to manually create an order of some or all of its contained posts to be shown before the default ordered posts in that category or tag, or re-arange all posts as they apear on home(index) and archive pages.

(Please Note: You have to individually set order for each category or sub category you want to order a sticky post in, if enough people express it as a requirement I'll add functionality for the plugin to propagate order set in the index view to either all- or specific categories tags. Mail me if you need this.)

 AND / OR  

Meta: Use the radio buttons to specify meta-stickyness, respectively: 

1. Super-sticky: Show before anything else (you can set a limit for how many posts from this cat or tag should be given this preferential treatment, e.g. if you want the latest post with the tag 'events' to show before anything else in any category listing that contains that post place 1 in the textfield next to the 'events' tag and set it's radio button set to 'Super-sticky' )

2. Sub-sticky: Show after individually ordered posts ('Sorties') for given view but before un-sorted posts

3. Default: Treat normally (except for individually ordered posts)

4. Droppy: Show only after everything else
and remember to click 'update meta-stickyness' at the bottom of the page for your changes to, ahemmm, 'stick' . . .


== Installation ==

1. Upload the `AStickyPostOrderER` folder and its content to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. In the admin panel, go to Manage, AStickyPostOrderER the rest is explained right there.


== Screenshots ==

1. The main screen where you can define meta-stickiness or select a category or tag..
2. that will open in a new screen where you can manually arrange the order of posts.

== Changelog ==

0.2.3 (2009/08/20)
* Added pagination for listing of posts

0.2.2.9 (2008/06/09) 
* Fixed so when posts are deleted aStickyPostOrderER forgets aout them (in stead of retaining them in the order DB tables) 
  (Will code up a clean up to take care of existing 'holes' from previous versions in the not too distant future.)
* Incorporated a search filter with pagination for tags

0.2.2.8 (2008/04/28) 
* Fixed parent categories not showing order in WordPress 2.5
* Fixed weirdness previously resulting from removing posts from being ordered
* Added index.php (html version of readme with link to host site)
