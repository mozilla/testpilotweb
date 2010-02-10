<?php get_header(); ?>

<!-- category.php -->

	<div id="testcases-content">

	<?php if (have_posts()) : ?>
		<div id="archive_intro">
			<?php $post = $posts[0]; // Hack. Set $post so that the_date() works. ?>
			<?php  
			$current_category = single_cat_title("", false);
			$string = mb_strtolower($current_category);
			$patterns[0] = '/ /';
			$patterns[1] = '/&/';
			$patterns[2] = '/amp;/';
			$replacements[0] = '';
			$replacements[1] = '';
			$replacements[2] = '';
			$class_str = preg_replace($patterns, $replacements, $string);
			echo('<h2 class="pagetitle category-'.$class_str.'">'.$current_category.'</h2>');
			?>
		</div>
		<!-- loop starts -->
		
		<?php 
		$current = 0;
		while (have_posts()) : the_post(); 
        
        if ($current == 0) {
        ?>
		<div <?php post_class() ?>>
				<div class="entry">
					<?php the_content() ?>
				</div>
				
				<small><?php the_time('l, F jS, Y') ?></small>
				<p class="postmetadata"><?php the_tags('Tags: ', ', ', '<br />'); ?> <?php edit_post_link('Edit', '', ' | '); ?>  <?php comments_popup_link('No Comments &#187;', '1 Comment &#187;', '% Comments &#187;'); ?></p>
        <?php  
        $current++;
        } else { ?>
        <hr/>
		<div <?php post_class() ?>>
        
        <h2 id="post-<?php the_ID(); ?>"><a href="<?php the_permalink() ?>" rel="bookmark" title="Permanent Link to <?php the_title_attribute(); ?>"><?php the_title(); ?></a></h2>
        <?php
        $key = 'post-name';
        $themeta = get_post_meta($post->ID, $key, TRUE);
        if($themeta != '') { ?>
				<dl class="custom">
				    <dt>Contributed by:</dt>
				    <dd><?php echo get_post_meta($post->ID, 'post-name', true); ?></dd>
				    <dt>Original URL:</dt>
				    <dd><a href="<?php echo get_post_meta($post->ID, 'posturl', true); ?>"><?php echo get_post_meta($post->ID, 'posturl', true); ?></a></dd>
				</dl>
        <?php } ?>
				
				<div class="entry">
					<?php the_excerpt() ?>
				</div>
				
				<small><?php the_time('l, F jS, Y') ?></small>
				<p class="postmetadata"><?php the_tags('Tags: ', ', ', '<br />'); ?> Posted by <?php the_author(', ') ?> | <?php edit_post_link('Edit', '', ' | '); ?>  <?php comments_popup_link('No Comments &#187;', '1 Comment &#187;', '% Comments &#187;'); ?></p>                        
        </div>
        
			<!-- loop ends -->
    <?php	
        }
        endwhile;
    	endif;

?>

</div>
</div>

<?php get_sidebar(); ?>

<?php get_footer(); ?>
