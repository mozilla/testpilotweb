<?php
/**
 * @package WordPress
 * @subpackage TestPilot
 */
?>
<div id="sidebar">
<div id="submit-sidebar">
<h2>Who analyzes these test data?</h2>
<p>Mozilla community members do, you are welcome too! </p>

<p>Data is so much fun! There are so many ways to read it. By bringing your own perspective to the data, you may help us find new insights or flaws in existing analysis.  We are always excited to hear about new ways of interpreting the data and are happy to start a discussion about them any time.  We can even revise and re-run a study if someone thinks of additional data that would be illuminating to collect.</p>

<p><a href="/wordpress/submit/" class="button">Submit your analysis</a></p>
</div>
<h2>Jump to a Test Case</h2>
	<form action="<?php bloginfo('url'); ?>/" method="get">
<?php
	$select = wp_dropdown_categories('show_option_none=Select a Test Case&show_count=0&orderby=name&echo=0');
	$select = preg_replace("#<select([^>]*)>#", "<select$1 onchange='return this.form.submit()'>", $select);
	echo $select;
?>
	<noscript><input type="submit" value="View" /></noscript>
	</form>
</div>