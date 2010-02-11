<?php
/*
    Template Name: Logged-In Users Page
    
*/
?>

<?php if(is_user_logged_in()): ?>

<div id="testcases-content">

		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<div class="post" id="post-<?php the_ID(); ?>">
			<h2><?php the_title(); ?></h2>
			<?php the_content('<p>Read the rest of this page &raquo;</p>'); ?>
			<?php wp_link_pages(array('before' => '<p>Pages: ', 'after' => '</p>', 'next_or_number' => 'number')); ?>
		</div>
		<?php endwhile; endif; ?>
</div>

<?php else:
wp_die('We require you to create an account before you can submit test case analysis. You can <a href="/wordpress/wp-login.php?action=register">register free here</a>.');
endif; ?>
	
<?php get_sidebar(); ?>
<?php get_footer(); ?>