<?php
/**
 * @package WordPress
 * @subpackage TestPilot
 */

get_header(); ?>

<div id="testcases-content">
<p>Every couple of weeks we release a new test case through Test Pilot.  Each one of these test cases explores one interesting topic or tests one new prototype idea for Firefox or another Mozilla product.</p>

<p>Here is the list of test cases we are currently running, as well as those we have already completed, along with any analysis produced by us or by community members.</p>

	<?php 

		$categories = get_categories('child_of=3');
        
        echo '<h2>Current Test Cases</h2>';
		foreach($categories as $category) {
					  
				 echo '<dl class="current"><dt><a href="' . get_category_link( $category->term_id ) . '" title="' . sprintf( __( "View all posts in %s" ), $category->name ) . '" ' . '>' . $category->name.'</a></dt>';
				    echo '<dd>'. $category->description . ' <span class="view"><a href="' . get_category_link( $category->term_id ) . '">View this test case &raquo;</a></span></dd></dl>';

        }
        
        $categories = get_categories('child_of=8');
        
        if ($categories != "") {
        
        echo '<h2>Scheduled Test Cases</h2>';
            foreach($categories as $category) {
            			  
            		 echo '<dl class="archived"><dt><a href="' . get_category_link( $category->term_id ) . '" title="' . sprintf( __( "View all posts in %s" ), $category->name ) . '" ' . '>' . $category->name.'</a></dt>';
            		    echo '<dd>'. $category->description . ' <span class="view"><a href="' . get_category_link( $category->term_id ) . '">View this test case &raquo;</a></span></dd></dl>';				
            }
        } else {
            echo '<p>No upcoming test cases currently scheduled</p>';
        }
        
		$categories = get_categories('child_of=4');
        
        echo '<h3>Archived Test Cases</h3>';
		foreach($categories as $category) {
					  
				 echo '<dl class="archived"><dt><a href="' . get_category_link( $category->term_id ) . '" title="' . sprintf( __( "View all posts in %s" ), $category->name ) . '" ' . '>' . $category->name.'</a></dt>';
				    echo '<dd>'. $category->description . ' <span class="view"><a href="' . get_category_link( $category->term_id ) . '">View this test case &raquo;</a></span></dd></dl>';				
        }
        
    ?>
</div>
<?php get_sidebar(); ?>
<?php get_footer(); ?>