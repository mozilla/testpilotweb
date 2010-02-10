<?php
/*
Plugin Name: Gravity Forms
Plugin URI: http://www.gravityforms.com
Description: Easily create web forms and manage form entries within the WordPress admin.
Version: 1.3.9
Author: rocketgenius
Author URI: http://www.rocketgenius.com

------------------------------------------------------------------------
Copyright 2009 rocketgenius

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/


if(!defined("RG_CURRENT_PAGE"))
    define("RG_CURRENT_PAGE", basename($_SERVER['PHP_SELF']));

if(!defined("IS_ADMIN"))
    define("IS_ADMIN",  is_admin());

define("RG_CURRENT_VIEW", $_GET["view"]);
define("GF_SUPPORTED_WP_VERSION", version_compare(get_bloginfo("version"), '2.8.0', '>='));

if(!defined("GRAVITY_MANAGER_URL"))
    define("GRAVITY_MANAGER_URL", "http://www.gravityhelp.com/wp-content/plugins/gravitymanager");

add_action('init',  array('RGForms', 'init'));

class RGForms{

    //Plugin starting point. Will load appropriate files
    public static function init(){

        require_once(WP_PLUGIN_DIR . "/" . basename(dirname(__FILE__)) . "/common.php");
        require_once(WP_PLUGIN_DIR . "/" . basename(dirname(__FILE__)) . "/forms_model.php");

        load_plugin_textdomain( 'gravityforms', FALSE, '/gravityforms/languages' );

        if(IS_ADMIN){

            global $current_user;

            //Members plugin integration. Adding Gravity Forms roles to the checkbox list
            if ( function_exists( 'members_get_capabilities' ) ){
                add_filter('members_get_capabilities', array("RGForms", "members_get_capabilities"));

                //Removing default GF capability when integrating with Members
                if(current_user_can("gform_full_access"))
                    $current_user->remove_cap("gform_full_access");

                //If and administrator does not have any Gravity Form permission, add all of them. (will happen the first time Gravity Forms gets installed)
                self::initialize_permissions();
            }
            else
            {
                $gform_full_access = current_user_can("administrator") ? "gform_full_access" : "";
                $gform_full_access = apply_filters("gform_cap_full_access", $gform_full_access);

                if(!empty($gform_full_access))
                    $current_user->add_cap($gform_full_access);
            }

            //Loading Gravity Forms if user has access to any functionality
            if(GFCommon::current_user_can_any(GFCommon::all_caps()))
            {
                //runs the setup when version changes
                self::setup();

                //checks if an update is available. Runs periodically
                self::periodic_check_updates();

                //creates the "Forms" left menu
                add_action('admin_menu',  array('RGForms', 'create_menu'));


                if(GF_SUPPORTED_WP_VERSION){
                    require_once(GFCommon::get_base_path() . "/tooltips.php");

                    add_action('admin_footer',  array('RGForms', 'check_upload_folder'));
                    add_action('wp_dashboard_setup', array('RGForms', 'dashboard_setup'));

                    //Adding "embed form" button
                    add_action('media_buttons_context', array('RGForms', 'add_form_button'));

                    //Plugin update actions
                    add_action('update_option_update_plugins', array('GFCommon', 'check_update')); //for WP 2.7
                    add_action('update_option__transient_update_plugins', array('GFCommon', 'check_update')); //for WP 2.8

                    if(RG_CURRENT_PAGE == "plugins.php"){
                        add_action("admin_init", array('GFCommon', 'check_update'));
                    }
                    else if(in_array(RG_CURRENT_PAGE, array('post.php', 'page.php', 'page-new.php', 'post-new.php'))){
                        add_action('admin_footer',  array('RGForms', 'add_mce_popup'));
                    }
                    else if(self::is_gravity_page()){
                        add_action("admin_print_scripts", array('RGForms', 'print_scripts'));
                    }
                    else if(in_array(RG_CURRENT_PAGE, array("admin.php", "admin-ajax.php"))){

                        add_action('wp_ajax_rg_save_form', array('RGForms', 'save_form'));
                        add_action('wp_ajax_rg_change_input_type', array('RGForms', 'change_input_type'));
                        add_action('wp_ajax_rg_add_field', array('RGForms', 'add_field'));
                        add_action('wp_ajax_rg_delete_field', array('RGForms', 'delete_field'));
                        add_action('wp_ajax_rg_delete_file', array('RGForms', 'delete_file'));
                        add_action('wp_ajax_rg_select_export_form', array('RGForms', 'select_export_form'));
                        add_action('wp_ajax_rg_start_export', array('RGForms', 'start_export'));

                        //entry list ajax operations
                        add_action('wp_ajax_rg_update_lead_property', array('RGForms', 'update_lead_property'));

                        //form list ajax operations
                        add_action('wp_ajax_rg_update_form_active', array('RGForms', 'update_form_active'));

                        add_action('media_upload_rg_gform', array('RGForms', 'insert_form'));
                    }

                    add_action('after_plugin_row_gravityforms/gravityforms.php', array('RGForms', 'plugin_row') );
                    add_action('install_plugins_pre_plugin-information', array('RGForms', 'display_changelog'));
                }
            }
        }
        else{
            add_shortcode('gravityform', array('RGForms', 'parse_shortcode'));
            add_action('wp_enqueue_scripts', array('RGForms', 'enqueue_scripts'));
        }
    }

    //Setup permissions if Members plugin is installed, or give current user full GF permission if not.
    public static function initialize_permissions(){
        global $current_user;

        $is_gravity_forms_installation = get_option("rg_form_version") != GFCommon::$version;
        $is_members_installation = get_option("rg_members_installed");
        $is_admin_with_no_permissions = current_user_can("administrator") && !GFCommon::current_user_can_any(GFCommon::all_caps());

        //if this is a new gf install or members install and the administrator doesn't have any Gravity Forms permission, add all of them.
        if( ($is_gravity_forms_installation || $is_members_installation) && $is_admin_with_no_permissions){
            $role = get_role("administrator");
            foreach(GFCommon::all_caps() as $cap){
                $role->add_cap($cap);
            }
            update_option("rg_members_installed", true);
        }
    }

    //Creates or updates database tables. Will only run when version changes
    public static function setup(){
        global $wpdb;

        $version = GFCommon::$version;

        if(get_option("rg_form_version") != $version){

            require_once(ABSPATH . '/wp-admin/includes/upgrade.php');

            if ( ! empty($wpdb->charset) )
                $charset_collate = "DEFAULT CHARACTER SET $wpdb->charset";
            if ( ! empty($wpdb->collate) )
                $charset_collate .= " COLLATE $wpdb->collate";

            //------ FORM -----------------------------------------------
            $form_table_name = RGFormsModel::get_form_table_name();
            $sql = "CREATE TABLE " . $form_table_name . " (
                  id mediumint(8) unsigned not null auto_increment,
                  title varchar(150) not null,
                  date_created datetime not null,
                  is_active tinyint(1) not null default 1,
                  PRIMARY KEY  (id)
                ) $charset_collate;";
            dbDelta($sql);

            //------ META -----------------------------------------------
            $meta_table_name = RGFormsModel::get_meta_table_name();
            $sql = "CREATE TABLE " . $meta_table_name . " (
                  form_id mediumint(8) unsigned not null,
                  display_meta longtext,
                  entries_grid_meta longtext,
                  KEY form_id (form_id)
                ) $charset_collate;";
            dbDelta($sql);

            //------ FORM VIEW -----------------------------------------------
            $form_view_table_name = RGFormsModel::get_form_view_table_name();
            $sql = "CREATE TABLE " . $form_view_table_name . " (
                  id bigint(20) unsigned not null auto_increment,
                  form_id mediumint(8) unsigned not null,
                  date_created datetime not null,
                  ip char(15),
                  count mediumint(8) unsigned not null default 1,
                  PRIMARY KEY  (id),
                  KEY form_id (form_id)
                ) $charset_collate;";
            dbDelta($sql);

            //------ LEAD -----------------------------------------------
            $lead_table_name = RGFormsModel::get_lead_table_name();
            $sql = "CREATE TABLE " . $lead_table_name . " (
                  id int(10) unsigned not null auto_increment,
                  form_id mediumint(8) unsigned not null,
                  post_id bigint(20) unsigned,
                  date_created datetime not null,
                  is_starred tinyint(1) not null default 0,
                  is_read tinyint(1) not null default 0,
                  ip char(15) not null,
                  source_url varchar(200) not null default '',
                  user_agent varchar(250) not null default '',
                  PRIMARY KEY  (id),
                  KEY form_id (form_id)
                ) $charset_collate;";
           dbDelta($sql);

           //------ LEAD NOTES ------------------------------------------
            $lead_notes_table_name = RGFormsModel::get_lead_notes_table_name();
            $sql = "CREATE TABLE " . $lead_notes_table_name . " (
                  id int(10) unsigned not null auto_increment,
                  lead_id int(10) unsigned not null,
                  user_name varchar(250),
                  user_id bigint(20),
                  date_created datetime not null,
                  value longtext,
                  PRIMARY KEY  (id),
                  KEY lead_id (lead_id),
                  KEY lead_user_key (lead_id,user_id)
                ) $charset_collate;";
           dbDelta($sql);

            //------ LEAD DETAIL -----------------------------------------
            $lead_detail_table_name = RGFormsModel::get_lead_details_table_name();
            $sql = "CREATE TABLE " . $lead_detail_table_name . " (
                  id bigint(20) unsigned not null auto_increment,
                  lead_id int(10) unsigned not null,
                  form_id mediumint(8) unsigned not null,
                  field_number float not null,
                  value varchar(". GFORMS_MAX_FIELD_LENGTH ."),
                  PRIMARY KEY  (id),
                  KEY form_id (form_id),
                  KEY lead_id (lead_id)
                ) $charset_collate;";
            dbDelta($sql);

            //------ LEAD DETAIL LONG -----------------------------------
            $lead_detail_long_table_name = RGFormsModel::get_lead_details_long_table_name();
            $sql = "CREATE TABLE " . $lead_detail_long_table_name . " (
                  lead_detail_id bigint(20) unsigned not null,
                  value longtext,
                  KEY lead_detail_key (lead_detail_id)
                ) $charset_collate;";
            dbDelta($sql);

            //fix checkbox value. needed for version 1.0 and below but won't hurt for higher versions
            self::fix_checkbox_value();
        }
        update_option("rg_form_version", $version);
    }

    //Changes checkbox entry values from "!" to the current choice text. Neededed when upgrading users from 1.0
    private static function fix_checkbox_value(){
        global $wpdb;

        $table_name = RGFormsModel::get_lead_details_table_name();

        $sql = "select * from $table_name where value= '!'";
        $results = $wpdb->get_results($sql);
        foreach($results as $result){
            $form = RGFormsModel::get_form_meta($result->form_id);
            $field = RGFormsModel::get_field($form, $result->field_number);
            if($field["type"] == "checkbox"){
                $input = GFCommon::get_input($field, $result->field_number);
                $wpdb->update($table_name, array("value" => $input["label"]), array("id" => $result->id));
            }
        }
    }

    //Target of Member plugin filter. Provides the plugin with Gravity Forms lists of capabilities
    public static function members_get_capabilities( $caps ) {
        return array_merge($caps, GFCommon::all_caps());
    }

    //Tests if the upload folder is writable and displays an error message if not
    public static function check_upload_folder(){
        //check if upload folder is writable
        $folder = RGFormsModel::get_upload_root();
        if(empty($folder))
            echo "<div class='error'>Upload folder is not writable. Export and file upload features will not be functional.</div>";
    }

    //Every 12 hours, checks if a new version of Gravity Forms is available for download.
    public static function periodic_check_updates(){
        $last_update_check = get_option("rg_gform_last_update");
        $twelve_hours = 43200;
        if(empty($last_update_check) || (time() - $last_update_check) > $twelve_hours){
            GFCommon::check_update();
            GFCommon::cache_remote_message();
            update_option("rg_gform_last_update", time());
        }
    }

    //Prints common admin scripts
    public static function print_scripts(){
        wp_enqueue_script("sack");
        wp_print_scripts();
    }

    //Returns true if the current page is one of Gravity Forms pages. Returns false if not
    private static function is_gravity_page(){
        $current_page = trim(strtolower($_GET["page"]));
        $gf_pages = array("gf_edit_forms","gf_new_form","gf_entries","gf_settings","gf_export","gf_help");

        return in_array($current_page, $gf_pages);
    }

    //Creates "Forms" left nav
    public static function create_menu(){

        $has_full_access = current_user_can("gform_full_access");
        $min_cap = GFCommon::current_user_can_which(GFCommon::all_caps());
        if(empty($min_cap))
            $min_cap = "gform_full_access";

        $addon_menus = array();
        $addon_menus = apply_filters("gform_addon_navigation", $addon_menus);

        $parent_menu = self::get_parent_menu($addon_menus);

        // Add a top-level left nav
        add_object_page(__('Forms', "gravityforms"), __("Forms", "gravityforms"), $has_full_access ? "gform_full_access" : $min_cap, $parent_menu["name"] , $parent_menu["callback"], GFCommon::get_base_url() . '/images/gravity-admin-icon.png');

        // Adding submenu pages
        add_submenu_page($parent_menu["name"], __("Edit Forms", "gravityforms"), __("Edit Forms", "gravityforms"), $has_full_access ? "gform_full_access" : "gravityforms_edit_forms", "gf_edit_forms", array("RGForms", "forms"));

        add_submenu_page($parent_menu["name"], __("New Form", "gravityforms"), __("New Form", "gravityforms"), $has_full_access ? "gform_full_access" : "gravityforms_create_form", "gf_new_form", array("RGForms", "new_form"));

        add_submenu_page($parent_menu["name"], __("Entries", "gravityforms"), __("Entries", "gravityforms"), $has_full_access ? "gform_full_access" : "gravityforms_view_entries", "gf_entries", array("RGForms", "all_leads_page"));

        if(is_array($addon_menus)){
            foreach($addon_menus as $addon_menu)
                add_submenu_page($parent_menu["name"], $addon_menu["label"], $addon_menu["label"], $has_full_access ? "gform_full_access" : $addon_menu["permission"], $addon_menu["name"], $addon_menu["callback"]);
        }

        add_submenu_page($parent_menu["name"], __("Settings", "gravityforms"), __("Settings", "gravityforms"), $has_full_access ? "gform_full_access" : "gravityforms_view_settings", "gf_settings", array("RGForms", "settings_page"));

        add_submenu_page($parent_menu["name"], __("Export", "gravityforms"), __("Export", "gravityforms"), $has_full_access ? "gform_full_access" : "gravityforms_export_entries", "gf_export", array("RGForms", "export_page"));

        add_submenu_page($parent_menu["name"], __("Help", "gravityforms"), __("Help", "gravityforms"), $has_full_access ? "gform_full_access" : $min_cap, "gf_help", array("RGForms", "help_page"));

    }

    //Returns the parent menu item. It needs to be the same as the first sub-menu (otherwise WP will duplicate the main menu as a sub-menu)
    public static function get_parent_menu($addon_menus){

        if(GFCommon::current_user_can_any("gravityforms_edit_forms"))
            $parent = array("name" => "gf_edit_forms", "callback" => array("RGForms", "forms"));

        else if(GFCommon::current_user_can_any("gravityforms_create_form"))
            $parent = array("name" => "gf_new_form", "callback" => array("RGForms", "new_form"));

        else if(GFCommon::current_user_can_any("gravityforms_view_entries"))
            $parent = array("name" => "gf_entries", "callback" => array("RGForms", "all_leads_page"));

        else if(is_array($addon_menus) && sizeof($addon_menus) > 0){
            foreach($addon_menus as $addon_menu)
                if(GFCommon::current_user_can_any($addon_menu["permission"]))
                {
                    $parent = array("name" => $addon_menu["name"], "callback" => $addon_menu["callback"]);
                    break;
                }
        }
        else if(GFCommon::current_user_can_any("gravityforms_view_settings"))
            $parent = array("name" => "gf_settings", "callback" => array("RGForms", "settings_page"));

        else if(GFCommon::current_user_can_any("gravityforms_export_entries"))
            $parent = array("name" => "gf_export", "callback" => array("RGForms", "export_page"));

        else if(GFCommon::current_user_can_any(GFCommon::all_caps()))
            $parent = array("name" => "gf_help", "callback" => array("RGForms", "help_page"));

        return $parent;
    }

    //Parses the [gravityform shortcode and returns the front end form UI
    public static function parse_shortcode($attributes){
        extract(shortcode_atts(array(
             'title' => true,
             'description' => true,
             'id' => 0,
             'field_values' => ""
          ), $attributes));

        $title = strtolower($title) == "false" ? false : true;
        $description = strtolower($description) == "false" ? false : true;
        $field_values = htmlspecialchars_decode($field_values);

        parse_str($field_values, $field_value_array); //parsing query string like string for field values and placing them into an associative array
        $field_value_array = stripslashes_deep($field_value_array);

        return self::get_form($id, $title, $description, false, $field_value_array);
    }


//------------------------------------------------------
//------------- PAGE/POST EDIT PAGE ---------------------

    //Action target that adds the "Insert Form" button to the post/page edit screen
    public static function add_form_button($context){
        $image_btn = GFCommon::get_base_url() . "/images/form-button.png";
        $out = '<a href="#TB_inline?width=450&inlineId=select_form" class="thickbox" title="' . __("Add Gravity Form", 'gravityforms') . '"><img src="'.$image_btn.'" alt="' . __("Add Gravity Form", 'gravityform') . '" /></a>';
        return $context . $out;
    }

    //Action target that displays the popup to insert a form to a post/page
    function add_mce_popup(){
        ?>
        <script>
            function InsertForm(){
                var form_id = jQuery("#add_form_id").val();
                if(form_id == ""){
                    alert("<?php _e("Please select a form", "gravityforms") ?>");
                    return;
                }

                var form_name = jQuery("#add_form_id option[value='" + form_id + "']").text().replace(" ", "");
                var display_title = jQuery("#display_title").is(":checked");
                var display_description = jQuery("#display_description").is(":checked");
                var title_qs = !display_title ? " title=false" : "";
                var description_qs = !display_description ? " description=false" : "";

                var win = window.dialogArguments || opener || parent || top;
                win.send_to_editor("[gravityform id=" + form_id + " name=" + form_name + title_qs + description_qs +"]");
            }
        </script>

        <div id="select_form" style="display:none;">
            <div class="wrap">
                <div>
                    <div style="padding:15px 15px 0 15px;">
                        <h3 style="color:#5A5A5A!important; font-family:Georgia,Times New Roman,Times,serif!important; font-size:1.8em!important; font-weight:normal!important;"><?php _e("Insert A Form", "gravityforms"); ?></h3>
                        <span>
                            <?php _e("Select a form below to add it to your post or page.", "gravityforms"); ?>
                        </span>
                    </div>
                    <div style="padding:15px 15px 0 15px;">
                        <select id="add_form_id">
                            <option value="">  <?php _e("Select a Form", "gravityforms"); ?>  </option>
                            <?php
                                $forms = RGFormsModel::get_forms(1);
                                foreach($forms as $form){
                                    ?>
                                    <option value="<?php echo absint($form->id) ?>"><?php echo esc_html($form->title) ?></option>
                                    <?php
                                }
                            ?>
                        </select> <br/>
                        <div style="padding:8px 0 0 0; font-size:11px; font-style:italic; color:#5A5A5A"><?php _e("Can't find your form? Make sure it is active.", "gravityforms"); ?></div>
                    </div>
                    <div style="padding:15px 15px 0 15px;">
                        <input type="checkbox" id="display_title" checked='checked' /> <label for="display_title"><?php _e("display form title", "gravityforms"); ?></label> &nbsp;&nbsp;&nbsp;
                        <input type="checkbox" id="display_description" checked='checked' /> <label for="display_description"><?php _e("display form description", "gravityforms"); ?></label>
                    </div>
                    <div style="padding:15px;">
                        <input type="button" class="button-primary" value="Insert Form" onclick="InsertForm();"/>&nbsp;&nbsp;&nbsp;
                    <a class="button" style="color:#bbb;" href="#" onclick="tb_remove(); return false;"><?php _e("Cancel", "gravityforms"); ?></a>
                    </div>
                </div>
            </div>
        </div>

        <?php
    }


//------------------------------------------------------
//------------- PLUGINS PAGE ---------------------------

    //Displays message on Plugin's page
    public static function plugin_row($plugin_name){

        $key = GFCommon::get_key();
        $version_info = GFCommon::get_version_info();

        if(!$version_info["is_valid_key"]){

            $plugin_name = "gravityforms/gravityforms.php";

            $new_version = version_compare(GFCommon::$version, $version_info["version"], '<') ? __('There is a new version of Gravity Forms available.', 'gravityforms') .' <a class="thickbox" title="Gravity Forms" href="plugin-install.php?tab=plugin-information&plugin=gravityforms&TB_iframe=true&width=640&height=808">'. sprintf(__('View version %s Details', 'gravityforms'), $version_info["version"]) . '</a>. ' : '';
            echo '</tr><tr class="plugin-update-tr"><td colspan="5" class="plugin-update"><div class="update-message">' . $new_version . __('<a href="admin.php?page=gf_settings">Register</a> your copy of Gravity Forms to receive access to automatic upgrades and support. Need a license key? <a href="http://www.gravityforms.com">Purchase one now</a>.', 'gravityforms') . '</div></td>';
        }
    }

    //Displays current version details on Plugin's page
    public static function display_changelog(){
        if($_REQUEST["plugin"] != "gravityforms")
            return;

        $key = GFCommon::get_key();
        $body = "key=$key";
        $options = array('method' => 'POST', 'timeout' => 3, 'body' => $body);
        $options['headers'] = array(
            'Content-Type' => 'application/x-www-form-urlencoded; charset=' . get_option('blog_charset'),
            'Content-Length' => strlen($body),
            'User-Agent' => 'WordPress/' . get_bloginfo("version"),
            'Referer' => get_bloginfo("url")
        );

        $raw_response = wp_remote_request(GRAVITY_MANAGER_URL . "/changelog.php?" . GFCommon::get_remote_request_params(), $options);

        if ( is_wp_error( $raw_response ) || 200 != $raw_response['response']['code']){
            $page_text = __("Oops!! Something went wrong.<br/>Please try again or <a href='http://www.gravityforms.com'>contact us</a>.", 'gravityforms');
        }
        else{
            $page_text = $raw_response['body'];
            if(substr($page_text, 0, 10) != "<!--GFM-->")
                $page_text = "";
        }
        echo stripslashes($page_text);

        exit;
    }


//------------------------------------------------------
//-------------- DASHBOARD PAGE -------------------------

    //Registers the dashboard widget
    public static function dashboard_setup(){
        wp_add_dashboard_widget('rg_forms_dashboard', 'Gravity Forms',  array('RGForms', 'dashboard'));
    }

    //Displays the dashboard UI
    public static function dashboard(){
        $forms = RGFormsModel::get_form_summary();

        if(sizeof($forms) > 0){
            ?>
            <table class="widefat fixed" cellspacing="0" style="border:0px;">
                <thead>
                    <td style="text-align:left; padding:8px 0!important; font-weight:bold;"><i>Form Name</i></th>
                    <td style="text-align:center; padding:8px 0!important; font-weight:bold;"><i>Unread Entries</i></th>
                    <td style="text-align:left; padding:8px 0!important; font-weight:bold;"><i>Last Entry</i></th>
                </thead>

                <tbody class="list:user user-list">
                    <?php
                    foreach($forms as $form){
                        $date_display = GFCommon::format_date($form["last_lead_date"]);

                        ?>
                        <tr class='author-self status-inherit' valign="top">
                            <td class="column-title" style="padding:8px 0;">
                                <a style="display:inline;white-space: nowrap; width: 100%; overflow: hidden; text-overflow: ellipsis; <?php echo  $form["unread_count"] > 0 ? "font-weight:bold;" : "" ?>" href="admin.php?page=gf_entries&view=entries&id=<?php echo absint($form["id"]) ?>" title="<?php echo esc_html($form["title"]) ?> : <?php _e("View All Entries", "gravityforms") ?>"><?php echo esc_html($form["title"]) ?></a>
                            </td>
                            <td class="column-date" style="padding:8px 0; text-align:center;"><a style="<?php echo $form["unread_count"] > 0 ? "font-weight:bold;" : "" ?>" href="admin.php?page=gf_entries&view=entries&id=<?php echo absint($form["id"]) ?>" title="<?php _e("View Unread Entries", "gravityforms") ?>"><?php echo absint($form["unread_count"]) ?></a></td>
                            <td class="column-date" style="padding-top:7px;"><?php echo esc_html($date_display) ?></td>
                        </tr>
                        <?php
                    }
                    ?>
                </tbody>
            </table>

            <p class="textright">
            <a class="button" href="admin.php?page=gf_edit_forms">View All Forms</a>
          </p>
            <?php
        }
        else{
            ?>
            <div>
                <?php _e(sprintf("You don't have any forms. Let's go %s create one %s!", '<a href="admin.php?page=gf_new_form">', '</a>'), 'gravityforms'); ?>
            </div>
            <?php
        }
    }


//------------------------------------------------------
//--------------- ALL OTHER PAGES ---------------------

    public static function get_form($form_id, $display_title=true, $display_description=true, $force_display=false, $field_values=null){
        require_once(GFCommon::get_base_path() . "/form_display.php");
        return GFFormDisplay::get_form($form_id, $display_title, $display_description, $force_display, $field_values);
    }

    public static function new_form(){
        self::forms_page(0);
    }

    public static function enqueue_scripts(){
        require_once(GFCommon::get_base_path() . "/form_display.php");
        GFFormDisplay::enqueue_scripts();
    }

    public static function forms_page($form_id){
        require_once(GFCommon::get_base_path() . "/form_detail.php");
        GFFormDetail::forms_page($form_id);
    }

    public static function settings_page(){
        require_once(GFCommon::get_base_path() . "/settings.php");
        GFSettings::settings_page();
    }

    public static function add_settings_page($name, $handle, $icon_path=""){
        require_once(GFCommon::get_base_path() . "/settings.php");
        GFSettings::add_settings_page($name, $handle, $icon_path);
    }

    public static function help_page(){
        require_once(GFCommon::get_base_path() . "/help.php");
        GFHelp::help_page();
    }

    public static function export_page(){
        require_once(GFCommon::get_base_path() . "/export.php");
        GFExport::export_page();
    }

    public static function start_export(){
        require_once(GFCommon::get_base_path() . "/export.php");
        GFExport::start_export();
    }

    public static function all_leads_page(){

        //displaying lead detail page if lead id is in the query string
        $lead_id = $_GET["lid"];
        if(!empty($lead_id))
        {
            require_once(GFCommon::get_base_path() . "/entry_detail.php");
            GFEntryDetail::lead_detail_page();
        }
        else{
            require_once(GFCommon::get_base_path() . "/entry_list.php");
            GFEntryList::all_leads_page();
        }
    }

    public static function form_list_page(){
        require_once(GFCommon::get_base_path() . "/form_list.php");
        GFFormList::form_list_page();
    }

    public static function forms(){
        if(!GFCommon::ensure_wp_version())
            return;

        $id = $_GET["id"];
        $view = $_GET["view"];

        if($view == "entries"){
            require_once(GFCommon::get_base_path() . "/entry_list.php");
            GFEntryList::leads_page($id);
        }
        else if($view == "entry"){
            require_once(GFCommon::get_base_path() . "/entry_detail.php");
            GFEntryDetail::lead_detail_page();
        }
        else if($view == "notification"){
            require_once(GFCommon::get_base_path() . "/notification.php");
            GFNotification::notification_page($id);
        }
        else if(is_numeric($id)){
            self::forms_page($id);
        }
        else{
            self::form_list_page();
        }

    }

//-------------------------------------------------
//----------- AJAX CALLS --------------------------

    //entry list
    public static function update_form_active(){
        check_ajax_referer('rg_update_form_active','rg_update_form_active');
        RGFormsModel::update_form_active($_POST["form_id"], $_POST["is_active"]);
    }
    public static function update_lead_property(){
        check_ajax_referer('rg_update_lead_property','rg_update_lead_property');
        RGFormsModel::update_lead_property($_POST["lead_id"], $_POST["name"], $_POST["value"]);
    }

    //form detail
    public static function save_form(){
        require_once(GFCommon::get_base_path() . "/form_detail.php");
        GFFormDetail::save_form();
    }
    public static function add_field(){
        require_once(GFCommon::get_base_path() . "/form_detail.php");
        GFFormDetail::add_field();
    }
    public static function delete_field(){
        require_once(GFCommon::get_base_path() . "/form_detail.php");
        GFFormDetail::delete_field();
    }
    public static function change_input_type(){
        require_once(GFCommon::get_base_path() . "/form_detail.php");
        GFFormDetail::change_input_type();
    }

    //entry detail
    public static function delete_file(){
        check_ajax_referer("rg_delete_file", "rg_delete_file");
        $lead_id =  intval($_POST["lead_id"]);
        $field_id =  intval($_POST["field_id"]);

        RGFormsModel::delete_file($lead_id, $field_id);
        die("EndDeleteFile($field_id);");
    }

    //export
    public static function select_export_form(){
        check_ajax_referer("rg_select_export_form", "rg_select_export_form");
        $form_id =  intval($_POST["form_id"]);
        $form = RGFormsModel::get_form_meta($form_id);
        $fields = array();

        //Adding default fields
        array_push($form["fields"],array("id" => "date_created" , "label" => __("Entry Date", "gravityforms")));
        array_push($form["fields"],array("id" => "ip" , "label" => __("User IP", "gravityforms")));
        array_push($form["fields"],array("id" => "source_url" , "label" => __("Source Url", "gravityforms")));

        if(is_array($form["fields"])){
            foreach($form["fields"] as $field){
                if(is_array($field["inputs"])){
                    foreach($field["inputs"] as $input)
                        $fields[] =  array($input["id"], GFCommon::get_label($field, $input["id"]));
                }
                else if(!$field["displayOnly"]){
                    $fields[] =  array($field["id"], GFCommon::get_label($field));
                }
            }
        }
        $field_json = GFCommon::json_encode($fields);

        die("EndSelectExportForm($field_json);");
    }
}

//Main function call. Should be used to insert a Gravity Form from code.
function gravity_form($id, $display_title=true, $display_description=true, $display_inactive=false, $field_values=null){
    echo RGForms::get_form($id, $display_title, $display_description, $display_inactive, $field_values);
}


?>
