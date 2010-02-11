<?php
/*
Plugin Name: Gravity Forms Addons
Plugin URI: http://www.seodenver.com/gravity-forms-addons/
Description: Add functionality and usability to the great Gravity Forms plugin.
Author: Katz Web Services, Inc.
Version: 1.2.1
Author URI: http://www.katzwebservices.com
*/

/*

Versions:

= 1.2.1 = 
* Fixed whitespace issue if site is gzip'ed. No need to upgrade if you aren't getting the `Warning: Cannot modify header information - headers already sent by...` PHP error.

= 1.2 = 
* Compatibility with Gravity Forms 1.3

= 1.1 =
* Added Edit link to Entries page to directly edit an entry
* Added a bunch of functions to use in directly accessing form and entry data from outside the plugin

= 1.0 =
* Launched plugin

*/

// Get Gravity Forms over here!
@include_once(WP_PLUGIN_DIR . "/gravityforms/gravityforms.php");
@include_once(WP_PLUGIN_DIR . "/gravityforms/forms_model.php");
@include_once(WP_PLUGIN_DIR . "/gravityforms/common.php"); // 1.3
@include_once(WP_PLUGIN_DIR . "/gravityforms/form_display.php"); // 1.3
$Forms = new RGForms();  $RG = new RGFormsModel(); 
if(class_exists(GFCommon)) { $Common = new GFCommon(); } else { $Common = false; }
if(class_exists(GFFormDisplay)) { $FormDisplay = new GFFormDisplay(); } else { $FormDisplay = false; }

// If Gravity Forms is installed and exists
if(class_exists(RGForms) && class_exists(RGFormsModel)) { 

	
	function kws_gf_css() {
		echo '<style type="text/css">';
			kws_gf_expand_boxes_css(); 	
		echo '</style>';
	}
	
	function kws_gf_expand_boxes_css() {
		echo '.gforms_edit_form ul.menu li ul { display:block!important; } ';
	}
	
	function kws_gf_js() {
		echo '<script type="text/javascript">
			jQuery(document).ready(function($) {';
		
			kws_gf_expand_boxes_js();
			kws_gf_add_edit_js();
			
		echo '});
		</script>';
	}
	
	function kws_gf_expand_boxes_js() { ?>
		$("ul.menu li ul").each(function() {
			// Prevent the slideUp/slideDown functions from working
			$(this).css('min-height', $(this).height()).css('height', $(this).height()) ;
		});
	<?php }
	
	function kws_gf_add_edit_js() {
	
			if(isset($_REQUEST['page']) && $_REQUEST['page'] == 'gf_entries') {
				?>
				$(".row-actions span.edit:contains('Delete')").each(function() { 
					var editLink = $(this).parents('tr').find('.column-title a').attr('href');
					editLink = editLink + '&screen_mode=edit';
					//alert();
					$(this).after('<span class="edit">| <a title="<?php _e("Edit this entry", "gravityforms"); ?>" href="'+editLink+'"><?php _e("Edit", "gravityforms"); ?></a></span>');
				});
				<?php 
			}	
	}
	// Allows for edit links to work with a link instead of a form (GET instead of POST)
	if(isset($_GET["screen_mode"])) { $_POST["screen_mode"] = $_GET["screen_mode"]; }

	function kws_gf_head() {
		if(is_admin()) {
			kws_gf_css();
			kws_gf_js();
		}
	}
	
	add_action('admin_head', 'kws_gf_head',1);
	

	// To retrieve textarea inputs from a lead 
	// Example: get_gf_field_value_long(22, '14');
	function get_gf_field_value_long($leadid, $fieldid) {
		global $Forms, $RG, $Common;
		return $RG->get_field_value_long($leadid, $fieldid);
	}
	
	function gf_field_value_long($leadid, $fieldid) {
		echo get_gf_field_value_long($leadid, $fieldid);
	}
	
	// Gives you the label for a form input (such as First Name). Enter in the form and the field ID to access the label.
	// Example: echo get_gf_field_label(1,1.3);
	function get_gf_field_label($form_id, $field_id) {
		global $Forms,$RG,$Common;
		$form = $RG->get_form_meta($form_id);
		foreach($form["fields"] as $field){
			if($field['id'] == $field_id) {
				$output = $Forms->escape_text($field['label']);
			}elseif(is_array($field['inputs'])) {
				foreach($field["inputs"] as $input){
					if($input['id'] == $field_id) {
						if($Common) {
							$output = esc_html($Common->get_label($field,$field_id));
						} else {
							$output = $Forms->escape_text($Forms->get_label($field,$field_id));
						}
					}
				}
			}
		}
		return $output;
	}
	function gf_field_label($form_id, $field_id) {
		echo get_gf_field_label($form_id, $field_id);
	}	
	
	// Returns a form using php instead of shortcode
	function get_gf_form($id, $display_title=true, $display_description=true, $force_display=false, $field_values=null){
		global $Forms,$RG,$Common,$FormDisplay;
		if($FormDisplay) {	
			return $FormDisplay->get_form($id, $display_title=true, $display_description=true, $force_display=false, $field_values=null);
		} else {
			return $RG->get_form($id, $display_title, $display_description);
		}
	}
	function gf_form($id, $display_title=true, $display_description=true, $force_display=false, $field_values=null){
		echo get_gf_form($id, $display_title, $display_description, $force_display, $field_values);
	}
	
	// Returns array of leads for a specific form
	function get_gf_leads($form_id, $sort_field_number=0, $sort_direction='DESC', $search='', $offset=0, $page_size=3000, $star=null, $read=null, $is_numeric_sort = false, $start_date=null, $end_date=null) {
		global $Forms, $RG,$Common;
		
		return $RG->get_leads($form_id,$sort_field_number, $sort_direction, $search, $offset, $page_size, $star, $read, $is_numeric_sort, $start_date, $end_date);
	}
	
	function gf_leads($form_id, $sort_field_number=0, $sort_direction='DESC', $search='', $offset=0, $page_size=3000, $star=null, $read=null, $is_numeric_sort = false, $start_date=null, $end_date=null) {
		echo get_gf_leads($form_id,$sort_field_number, $sort_direction, $search, $offset, $page_size, $star, $read, $is_numeric_sort, $start_date, $end_date);
	}
	

}
?>