=== Top Level Categories ===
Contributors: fil
Donate link: http://fortes.com/2007/02/27/top-level-categories-plugin-01/ 
Tags: categories, permalink
Requires at least: 2.0.9
Tested up to: 2.5
Stable tag: 1.0

This plugin allows you to remove the prefix before the URL to your category page (e.g. example.com/dogs instead of example.com/category/dogs)

== Description ==

The Top Level Categories plugin allows you to remove the prefix before the URL to your category page. For example, instead of http://fortes.com/category/work, I use http://fortes.com/work for the address my "work" category. WordPress doesn't allow you to have a blank prefix for categories (they insert `category/` before the name), this plugin works around that restriction.

== Installation ==

1. Copy the `top-level-cats.php` file into your `wp-content/plugins` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. That's it! :)

== Known Issues / Bugs ==

1. This plugin **will not work** if you have a permalink structure like `%postname` or `%category%/%postname%` -- there is currently no workaround

== Frequently Asked Questions ==

= My links are broken when using `%postname` or `%category%/%postname%` as my permalink structure =

This is a known issue, for which there is unfortunately no good workaround. If you add a suffix to your permalink structure (such as `.html`) you can fix this issue. For example, try `%category%/%postname%.html` -- I realize this is not ideal, but there is no good solution for this issue.

= How do I automatically redirect people from the old category permalink? =

Use the [Permalink Redirect Plugin](http://fucoder.com/code/permalink-redirect/)

= I'm getting 404 errors when I click on my category link =

First, make sure that you've followed the installation instructions -- you must manually update your permalink structure (in the 'Options' -> 'Permalinks' section of your admin). If that doesn't work, then let me know!

= I've found a bug, how can I tell you about it so you'll fix it for me? =

Go to http://fortes.com/contact and fill out the contact form. Make sure you let me know the following:

* What version of WordPress you're using
* What other plugins you're running
* What your permalink structure is
* Exactly what problem you're seeing

Unfortunately, I do have a life outside of this plugin, so don't be sad if I don't fix the bug within 5 minutes.

== Uninstall ==

1. Deactivate the plugin
1. That's it! :)
