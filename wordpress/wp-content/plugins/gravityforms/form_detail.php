<?php

class GFFormDetail{

    public static function forms_page($form_id){

        global $wpdb;

        if(!GFCommon::ensure_wp_version())
            return;



        if($_POST["operation"] == "delete"){
            check_admin_referer('gforms_delete_form', 'gforms_delete_form');
            RGFormsModel::delete_form($form_id);
            ?>
                <script>
                jQuery(document).ready(
                    function(){document.location.href="?page=gf_edit_forms";}
                );
                </script>
            <?php
            exit;
        }

        wp_print_scripts(array("jquery-ui-core","jquery-ui-sortable","jquery-ui-tabs","sack","thickbox"));
        wp_print_styles(array("thickbox"));
        ?>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/jquery.dimensions.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/floatmenu_init.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/menu.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/jquery.json-1.3.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/jquery.simplemodal-1.3.min.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/forms.js"></script>
        <script src="<?php echo GFCommon::get_base_url() ?>/js/jquery-ui/ui.datepicker.js"></script>

        <link rel="stylesheet" href="<?php echo GFCommon::get_base_url() ?>/css/jquery-ui-1.7.2.custom.css" type="text/css" />
        <link rel="stylesheet" href="<?php echo GFCommon::get_base_url() ?>/css/admin.css" type="text/css" />
        <script>
            jQuery(document).ready(
                function() {
                    jQuery('.datepicker').datepicker({showOn: "both", buttonImage: "<?php echo GFCommon::get_base_url() ?>/images/calendar.png", buttonImageOnly: true});
                }
            );

            function has_entry(fieldNumber){
                var submitted_fields = new Array(<?php echo RGFormsModel::get_submitted_fields($form_id) ?>);
                for(var i=0; i<submitted_fields.length; i++){
                    if(submitted_fields[i] == fieldNumber)
                        return true;
                }
                return false;
            }

            function InsertVariable(element_id){
                var variable = jQuery('#' + element_id + '_variable_select').val();
                var messageElement = jQuery("#" + element_id);

                if(document.selection) {
                    // Go the IE way
                    messageElement[0].focus();
                    document.selection.createRange().text=variable;
                }
                else if(messageElement[0].selectionStart) {
                    // Go the Gecko way
                    obj = messageElement[0]
                    obj.value = obj.value.substr(0, obj.selectionStart) + variable + obj.value.substr(obj.selectionEnd, obj.value.length);
                }
                else {
                    messageElement.val(variable + messageElement.val());
                }

                jQuery('#' + element_id + '_variable_select')[0].selectedIndex = 0;
            }

        </script>

        <style>
            .field_type li {
                float:left;
                width:50%;
            }
            .field_type input{
                width:100px;
            }
        </style>

        <?php

        $form = RGFormsModel::get_form_meta($form_id);

        if(is_object($form) || is_array($form))
            echo "<script>var form = " . GFCommon::json_encode($form) . ";</script>";
        else
            echo "<script>var form = new Form();</script>";

        ?>

        <div class="wrap gforms_edit_form">
            <a class="gforms_settings_button" href="javascript:FieldClick(jQuery('#gform_heading')[0]);"><?php _e("Form Settings", "gravityforms"); ?></a>
            <?php echo GFCommon::get_remote_message(); ?>
            <img alt="<?php _e("Gravity Forms", "gravityforms") ?>" src="<?php echo GFCommon::get_base_url()?>/images/gravity-title-icon-32.png" class="gtitle_icon"/>
            <h2><?php _e("Form Editor", "gravityforms"); ?></h2>

            <table width="100%">
            <tr>
                <td class="pad_top" valign="top">

                    <div id="gform_heading" class="selectable">
                        <form method="post" id="form_delete">
                            <?php wp_nonce_field('gforms_delete_form', 'gforms_delete_form') ?>

                            <?php if(GFCommon::current_user_can_any("gravityforms_delete_forms")){
                                $delete_link = '<a href="javascript:void(0);" class="form_delete_icon" title="' . __("Delete this Form", "gravityforms") . '" onclick="if(confirm(\'' . __("Would you like to delete this form and ALL entries associated with it? \'Cancel\' to stop. \'OK\' to delete", "gravityforms") . '\')){jQuery(\'#form_delete\')[0].submit();} else{return false;}">' . __("Delete Form", "gravityforms") . '</a>';
                                echo apply_filters("gform_form_delete_link", $delete_link);
                                ?>

                            <?php } ?>
                            <a href="javascript:void(0);" class="form_edit_icon edit_icon_collapsed" title="<?php _e("Edit Form's properties", "gravityforms"); ?>"><?php _e("Edit", "gravityforms"); ?></a>

                            <input type="hidden" value="delete" name="operation"/>
                        </form>
                        <h3 id="gform_title"></h3>
                        <span id="gform_description">&nbsp;</span>

                        <div id="form_settings" style="display:none;">
                            <ul>
                                <li style="width:100px; padding:0px;"><a href="#gform_settings_tab_1"><?php _e("Properties", "gravityforms"); ?></a></li>
                                <li style="width:100px; padding:0px; "><a href="#gform_settings_tab_2"><?php _e("Advanced", "gravityforms"); ?></a></li>
                                <li style="width:120px; padding:0px; "><a href="#gform_settings_tab_3"><?php _e("Confirmation", "gravityforms"); ?></a></li>
                            </ul>
                            <div id="gform_settings_tab_1">
                                <ul class="gforms_form_settings">
                                    <li>
                                        <label for="form_title_input" style="display:block;">
                                            <?php _e("Title", "gravityforms"); ?>
                                            <?php gform_tooltip("form_tile") ?>
                                        </label>
                                        <input type="text" id="form_title_input" class="fieldwidth-3" onkeyup="UpdateFormProperty('title', this.value);" />
                                    </li>
                                    <li>
                                        <label for="form_description_input" style="display:block;">
                                            <?php _e("Description", "gravityforms"); ?>
                                            <?php gform_tooltip("form_description") ?>
                                        </label>
                                        <textarea id="form_description_input" class="fieldwidth-3 fieldheight-2" onkeyup="UpdateFormProperty('description', this.value);"/></textarea>
                                    </li>
                                    <li>
                                        <label for="form_label_placement" style="display:block;">
                                            <?php _e("Label Placement", "gravityforms"); ?>
                                            <?php gform_tooltip("form_label_placement") ?>
                                        </label>
                                        <select id="form_label_placement" onchange="UpdateLabelPlacement();">
                                            <option value="top_label"><?php _e("Top aligned", "gravityforms"); ?></option>
                                            <option value="left_label"><?php _e("Left aligned", "gravityforms"); ?></option>
                                            <option value="right_label"><?php _e("Right aligned", "gravityforms"); ?></option>
                                        </select>
                                    </li>
                                </ul>
                            </div>
                            <div id="gform_settings_tab_2">
                                <ul class="gforms_form_settings">
                                    <li>
                                        <label><?php _e("Form Button", "gravityforms"); ?></label>
                                        <div class="form_button_options">
                                            <input type="radio" id="form_button_text" name="form_button" value="text" onclick="ToggleButton();"/>
                                            <label for="form_button_text" class="inline">
                                                <?php _e("Default", "gravityforms"); ?>
                                                <?php gform_tooltip("form_button_text") ?>
                                            </label>
                                            &nbsp;&nbsp;
                                            <input type="radio" id="form_button_image" name="form_button" value="image" onclick="ToggleButton();"/>
                                            <label for="form_button_image" class="inline">
                                                <?php _e("Image", "gravityforms"); ?>
                                                <?php gform_tooltip("form_button_image") ?>
                                            </label>

                                            <div id="form_button_text_container" style="margin-top:5px;">
                                            <label for="form_button_text_input" class="float_label">
                                                    <?php _e("Text:", "gravityforms"); ?>
                                                </label>
                                                <input type="text" id="form_button_text_input" class="input_size_b" size="40" />
                                            </div>

                                            <div id="form_button_image_container" style="margin-top:5px;">
                                                <label for="form_button_image_url" class="inline">
                                                    <?php _e("Image Path:", "gravityforms"); ?>
                                                </label>
                                                <input type="text" id="form_button_image_url" size="45"/>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <label for="form_css_class" style="display:block;">
                                            <?php _e("CSS Class Name", "gravityforms"); ?>
                                            <?php gform_tooltip("form_css_class") ?>
                                        </label>
                                        <input type="text" id="form_css_class" class="fieldwidth-3"/>
                                    </li>
                                   <li>
                                        <input type="checkbox" id="gform_limit_entries" onclick="ToggleLimitEntry();"/> <label for="gform_limit_entries"><?php _e("Limit number of entries", "gravityforms") ?> <?php gform_tooltip("form_limit_entries") ?></label>
                                        <br/>
                                        <div id="gform_limit_entries_container" style="display:none;">
                                            <br/>
                                            <label for="gform_limit_entries_count" style="display:block;">
                                                <?php _e("Number of Entries", "gravityforms"); ?>
                                            </label>
                                            <input type="text" id="gform_limit_entries_count"/>
                                            <br/><br/>
                                            <label for="form_limit_entries_message" style="display:block;">
                                                <?php _e("Entry Limit Reached Message", "gravityforms"); ?>
                                            </label>
                                            <textarea id="form_limit_entries_message" class="fieldwidth-3"></textarea>
                                        </div>
                                   </li>
                                   <li>
                                        <input type="checkbox" id="gform_schedule_form" onclick="ToggleSchedule();"/> <label for="gform_schedule_form"><?php _e("Schedule form", "gravityforms") ?> <?php gform_tooltip("form_schedule_form") ?></label>
                                        <br/>
                                        <div id="gform_schedule_form_container" style="display:none;">
                                            <br/>
                                            <label for="gform_schedule_start" style="display:block;">
                                                <?php _e("Start Date/Time", "gravityforms"); ?>
                                            </label>
                                            <input type="text" id="gform_schedule_start" name="gform_schedule_start" class="datepicker"/>
                                            &nbsp;&nbsp;
                                            <select id="gform_schedule_start_hour">
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                                <option value="6">6</option>
                                                <option value="7">7</option>
                                                <option value="8">8</option>
                                                <option value="9">9</option>
                                                <option value="10">10</option>
                                                <option value="11">11</option>
                                                <option value="12">12</option>
                                            </select>
                                            :
                                            <select id="gform_schedule_start_minute">
                                                <option value="00">00</option>
                                                <option value="15">15</option>
                                                <option value="30">30</option>
                                                <option value="45">45</option>
                                            </select>
                                            <select id="gform_schedule_start_ampm">
                                                <option value="am">AM</option>
                                                <option value="pm">PM</option>
                                            </select>
                                            <br/><br/>
                                            <label for="gform_schedule_end" style="display:block;">
                                                <?php _e("End Date/Time", "gravityforms"); ?>
                                            </label>
                                            <input type="text" id="gform_schedule_end" class="datepicker"/>
                                            &nbsp;&nbsp;
                                            <select id="gform_schedule_end_hour">
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                                <option value="6">6</option>
                                                <option value="7">7</option>
                                                <option value="8">8</option>
                                                <option value="9">9</option>
                                                <option value="10">10</option>
                                                <option value="11">11</option>
                                                <option value="12">12</option>
                                            </select>
                                            :
                                            <select id="gform_schedule_end_minute">
                                                <option value="00">00</option>
                                                <option value="15">15</option>
                                                <option value="30">30</option>
                                                <option value="45">45</option>
                                            </select>
                                            <select id="gform_schedule_end_ampm">
                                                <option value="am">AM</option>
                                                <option value="pm">PM</option>
                                            </select>

                                            <br/><br/>
                                            <label for="gform_schedule_message" style="display:block;">
                                                <?php _e("Form Expired Message", "gravityforms"); ?>
                                            </label>
                                            <textarea id="gform_schedule_message" class="fieldwidth-3"></textarea>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div id="gform_settings_tab_3">
                                <ul class="gforms_form_settings">
                                    <li>
                                        <label><?php _e("Confirmation Message", "gravityforms"); ?></label>
                                        <div style="margin:4px 0;">
                                            <input type="radio" id="form_confirmation_show_message" name="form_confirmation" value="message" onclick="ToggleConfirmation();" />
                                            <label for="form_confirmation_show_messagex" class="inline">
                                                <?php _e("Text", "gravityforms"); ?>
                                                <?php gform_tooltip("form_confirmation_message") ?>
                                            </label>
                                            &nbsp;&nbsp;
                                            <input type="radio" id="form_confirmation_show_page" name="form_confirmation" value="page" onclick="ToggleConfirmation();" />
                                            <label for="form_confirmation_show_page" class="inline">
                                                <?php _e("Page", "gravityforms"); ?>
                                                <?php gform_tooltip("form_redirect_to_webpage") ?>
                                            </label>
                                            &nbsp;&nbsp;
                                            <input type="radio" id="form_confirmation_redirect" name="form_confirmation" value="redirect" onclick="ToggleConfirmation();" />
                                            <label for="form_confirmation_redirect" class="inline">
                                                <?php _e("Redirect", "gravityforms"); ?>
                                                <?php gform_tooltip("form_redirect_to_url") ?>
                                            </label>

                                            <div id="form_confirmation_message_container" style="padding-top:10px;">
                                                <div>
                                                    <?php GFCommon::insert_variables($form["fields"], "form_confirmation_message"); ?>
                                                </div>
                                                <textarea id="form_confirmation_message" style="width:400px; height:300px;" /></textarea>
                                            </div>

                                            <div id="form_confirmation_page_container" style="margin-top:5px;">
                                                <div>
                                                    <?php wp_dropdown_pages(array("name" => "form_confirmation_page", "show_option_none" => "Select a page")); ?>
                                                </div>
                                            </div>

                                            <div id="form_confirmation_redirect_container" style="margin-top:5px;">
                                                <div>
                                                    <input type="text" id="form_confirmation_url" style="width:98%;"/>
                                                </div>
                                                <div style="margin-top:15px;">
                                                    <input type="checkbox" id="form_redirect_use_querystring" onclick="ToggleQueryString()"/> <label for="form_redirect_use_querystring"><?php _e("Pass Field Data Via Query String", "gravityforms") ?> <?php gform_tooltip("form_redirect_querystring") ?></label>
                                                    <br/>
                                                    <div id="form_redirect_querystring_container" style="display:none;">
                                                        <div style="margin-top:6px;">
                                                            <?php GFCommon::insert_variables($form["fields"], "form_redirect_querystring", true); ?>
                                                        </div>
                                                        <textarea name="form_redirect_querystring" id="form_redirect_querystring" style="width:98%; height:100px;"></textarea><br/>
                                                        <div class="instruction"><?php _e("Sample: phone={Phone:1}&email{Email:2}", "gravityforms"); ?></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <ul id="gform_fields" class="<?php echo $form["labelPlacement"] ?>" style="position: relative;">
                        <?php
                        if(is_array($form["fields"]))
                        {
                            require_once(GFCommon::get_base_path() . "/form_display.php");
                            foreach($form["fields"] as $field){
                                echo GFFormDisplay::get_field($field, "", true);
                            }
                        }
                        ?>
                    </ul>

                    <div>
                        <?php
                            $button_text = $form["id"] > 0 ? __("Update Form", "gravityforms") : __("Save Form", "gravityforms");
                            $save_button = '<input type="button" class="button-primary" value="' . $button_text . '" onclick="SaveForm();" />';
                            $save_button = apply_filters("gform_save_form_button", $save_button);
                            echo $save_button;
                        ?>
                        <span id="please_wait_container" style="display:none; margin-left:15px;">
                            <img src="<?php echo GFCommon::get_base_url()?>/images/loading.gif"> <?php _e("Saving form. Please wait...", "gravityforms"); ?>
                        </span>
                        <div id="after_insert_dialog" style="display:none;">
                            <h3><?php _e("You have successfully saved your form!", "gravityforms"); ?></h3>
                            <p><?php _e("What do you want to do next?", "gravityforms"); ?></p>
                            <div class="new-form-option"><a title="<?php _e("Preview this form", "gravityforms"); ?>" id="preview_form_link" href="<?php echo GFCommon::get_base_url() ?>/preview.php?id={formid}" target="_blank"><?php _e("Preview this Form", "gravityforms"); ?></a></div>

                            <?php if(GFCommon::current_user_can_any("gravityforms_edit_forms")){ ?>
                                <div class="new-form-option"><a title="<?php _e("Setup email notifications for this form", "gravityforms"); ?>" id="notification_form_link" href="#"><?php _e("Setup Email Notifications for this Form", "gravityforms"); ?></a></div>
                            <?php } ?>

                            <div class="new-form-option"><a title="<?php _e("Continue editing this form", "gravityforms"); ?>" id="edit_form_link" href="#"><?php _e("Continue Editing this Form", "gravityforms"); ?></a></div>

                            <div class="new-form-option"><a title="<?php _e("I am done. Take me back to form list", "gravityforms"); ?>" href="?page=gf_edit_forms"><?php _e("Return to Form List", "gravityforms"); ?></a></div>

                        </div>
                        <h2></h2>
                        <div class="updated fade" id="after_update_dialog" style="padding:10px; display:none;">
                            <strong><?php _e("Form updated successfully.", "gravityforms"); ?></strong><br />
                            <a title="<?php _e("Continue editing this form", "gravityforms"); ?>" id="continue_form_link" href="javascript:void(0);" onclick="jQuery('#after_update_dialog').slideUp();"><?php _e("Continue Editing", "gravityforms"); ?></a> |
                            <a title="<?php _e("Setup email notifications for this form", "gravityforms"); ?>" href="?page=gf_edit_forms&view=notification&id=<?php echo absint($form["id"]) ?>"><?php _e("Setup Email Notifications", "gravityforms"); ?></a> |

                            <?php if(GFCommon::current_user_can_any("gravityforms_view_entries")){ ?>
                                <a title="<?php _e("View this form's entries", "gravityforms"); ?>" href="?page=gf_entries&view=entries&id=<?php echo absint($form["id"]) ?>"><?php _e("View Entries", "gravityforms"); ?></a> |
                            <?php } ?>

                            <a title="<?php _e("Preview this form", "gravityforms"); ?>" href="<?php echo GFCommon::get_base_url() ?>/preview.php?id=<?php echo absint($form["id"]) ?>" target="_blank"><?php _e("Preview Form", "gravityforms"); ?></a>
                        </div>
                    </div>
                    <div id="field_settings" style="display: none;">
                        <ul>
                            <li style="width:100px; padding:0px;"><a href="#gform_tab_1"><?php _e("Properties", "gravityforms"); ?></a></li>
                            <li style="width:100px; padding:0px; "><a href="#gform_tab_2"><?php _e("Advanced", "gravityforms"); ?></a></li>
                        </ul>
                        <div id="gform_tab_1">
                            <ul>
                            <li class="label_setting field_setting">
                                <label for="field_label">
                                    <?php _e("Field Label", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_label") ?>
                                </label>
                                <input type="text" id="field_label" class="fieldwidth-3" onkeyup="SetFieldLabel(this.value)" size="35"/>
                            </li>
                            <li class="post_custom_field_type_setting field_setting">
                                <label for="post_custom_field_type">
                                    <?php _e("Field Type", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_type") ?>
                                </label>
                                <select id="post_custom_field_type" onchange="if(jQuery(this).val() == '') return; jQuery('#field_settings').slideUp(function(){StartChangeInputType(jQuery('#post_custom_field_type').val());});">
                                    <option value="" class="option_header"><?php _e("", "gravityforms"); ?>Standard Fields</option>
                                    <option value="text"><?php _e("Single line text", "gravityforms"); ?></option>
                                    <option value="textarea"><?php _e("Paragraph Text", "gravityforms"); ?></option>
                                    <option value="select"><?php _e("Drop Down", "gravityforms"); ?></option>
                                    <option value="number"><?php _e("Number", "gravityforms"); ?></option>
                                    <option value="radio"><?php _e("Multiple Choice", "gravityforms"); ?></option>
                                    <option value="hidden"><?php _e("Hidden", "gravityforms"); ?></option>

                                    <option value="" class="option_header"><?php _e("Advanced Fields", "gravityforms"); ?></option>
                                    <option value="date"><?php _e("Date", "gravityforms"); ?></option>
                                    <option value="time"><?php _e("Time", "gravityforms"); ?></option>
                                    <option value="phone"><?php _e("Phone", "gravityforms"); ?></option>
                                    <option value="website"><?php _e("Website", "gravityforms"); ?></option>
                                    <option value="email"><?php _e("Email", "gravityforms"); ?></option>
                                </select>
                            </li>

                            <li class="captcha_theme_setting field_setting">
                                <label for="field_captcha_theme">
                                    <?php _e("Theme", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_recaptcha_theme") ?>
                                </label>
                                <select id="field_captcha_theme" onchange="SetCaptchaTheme(this.value, '<?php echo GFCommon::get_base_url() ?>/images/captcha_' + this.value + '.jpg')">
                                    <option value="red"><?php _e("Red", "gravityforms"); ?></option>
                                    <option value="white"><?php _e("White", "gravityforms"); ?></option>
                                    <option value="blackglass"><?php _e("Black Glass", "gravityforms"); ?></option>
                                    <option value="clean"><?php _e("Clean", "gravityforms"); ?></option>
                                </select>
                            </li>
                            <li class="post_custom_field_setting field_setting">
                                <label for="field_custom_field_name">
                                    <?php _e("Custom Field Name", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_custom_field_name") ?>
                                </label>
                                <div style="width:100px; float:left;">
                                    <input type="radio" name="field_custom" id="field_custom_existing" size="10" onclick="ToggleCustomField();" />
                                    <label for="field_custom_existing" class="inline">
                                        <?php _e("Existing", "gravityforms"); ?>
                                    </label>
                                </div>
                                <div style="width:100px; float:left;">
                                    <input type="radio" name="field_custom" id="field_custom_new" size="10" onclick="ToggleCustomField();" />
                                    <label for="field_custom_new" class="inline">
                                        <?php _e("New", "gravityforms"); ?>
                                    </label>
                                </div>
                                <div class="clear">
                                   <input type="text" id="field_custom_field_name_text" size="35" onkeyup="SetFieldProperty('postCustomFieldName', this.value);"/>
                                   <select id="field_custom_field_name_select" onchange="SetFieldProperty('postCustomFieldName', jQuery(this).val());">
                                        <option value=""><?php _e("Select an existing custom field", "gravityforms"); ?></option>
                                        <?php
                                            $custom_field_names = RGFormsModel::get_custom_field_names();
                                            foreach($custom_field_names as $name){
                                                ?>
                                                <option value="<?php echo $name?>"><?php echo $name?></option>
                                                <?php
                                            }
                                        ?>
                                    </select>
                                </div>
                            </li>


                            <li class="post_status_setting field_setting">
                                <label for="field_post_status">
                                    <?php _e("Post Status", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_post_status") ?>
                                </label>
                                <select id="field_post_status" name="field_post_status">
                                    <option value="draft">Draft</option>
                                    <option value="pending">Pending Review</option>
                                    <option value="publish">Published</option>
                                </select>
                            </li>

                            <li class="post_author_setting field_setting">
                                <label for="field_post_author">
                                    <?php _e("Default Post Author", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_post_author") ?>
                                </label>
                                <?php wp_dropdown_users(array('name' => 'field_post_author')) ?>
                                <div>
                                    <input type="checkbox" id="gfield_current_user_as_author"/>
                                    <label for="gfield_current_user_as_author" class="inline"><?php _e("Use logged in user as author", "gravityforms"); ?> <?php gform_tooltip("form_field_current_user_as_author") ?></label>
                                </div>
                            </li>
                            <li class="post_category_setting field_setting">
                                <label for="field_post_category">
                                    <?php _e("Post Category", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_post_category") ?>
                                </label>
                                <?php wp_dropdown_categories(array('selected' => get_option('default_category'), 'hide_empty' => 0, 'id' => 'field_post_category', 'name' => 'field_post_category', 'orderby' => 'name', 'selected' => 'field_post_category', 'hierarchical' => true )); ?>
                            </li>

                            <li class="post_category_checkbox_setting field_setting">
                                <label for="field_post_category">
                                    <?php _e("Category", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_post_category_selection") ?>
                                </label>

                                <input type="radio" id="gfield_category_all" name="gfield_category" value="all" onclick="ToggleCategory();"/>
                                <label for="gfield_category_all" class="inline">
                                    <?php _e("All Categories", "gravityforms"); ?>

                                </label>
                                &nbsp;&nbsp;
                                <input type="radio" id="gfield_category_select" name="gfield_category" value="select" onclick="ToggleCategory();"/>
                                <label for="form_button_image" class="inline">
                                    <?php _e("Select Categories", "gravityforms"); ?>
                                </label>

                                <div id="gfield_settings_category_container">
                                    <table cellpadding="0" cellspacing="5">
                                    <?php
                                        $categories = get_categories( array('hide_empty' => 0) );
                                        $count = 0;
                                        $category_rows = '';
                                        self::_cat_rows($categories, $count, $category_rows);
                                        echo $category_rows;
                                    ?>
                                    </table>
                                </div>
                            </li>

                            <li class="post_image_setting field_setting">
                                <label><?php _e("Image Metadata", "gravityforms") ?> <?php gform_tooltip("form_field_image_meta") ?></label>
                                <input type="checkbox" id="gfield_display_title" onclick="SetPostImageMeta();" />
                                <label for="gfield_display_title" class="inline">
                                    <?php _e("Title", "gravityforms"); ?>
                                </label>
                                <br/>
                                <input type="checkbox" id="gfield_display_caption"  onclick="SetPostImageMeta();" />
                                <label for="gfield_display_caption" class="inline">
                                    <?php _e("Caption", "gravityforms"); ?>
                                </label>
                                <br/>
                                <input type="checkbox" id="gfield_display_description"  onclick="SetPostImageMeta();"/>
                                <label for="gfield_display_description" class="inline">
                                    <?php _e("Description", "gravityforms"); ?>
                                </label>
                            </li>

                            <li class="address_setting field_setting">
                                <label for="field_address_type">
                                    <?php _e("Address Type", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_address_type") ?>
                                </label>
                                <select id="field_address_type" onchange="SetAddressType();">
                                    <option value="international"><?php _e("International", "gravityforms"); ?></option>
                                    <option value="us"><?php _e("United States", "gravityforms"); ?></option>
                                    <option value="canadian"><?php _e("Canadian", "gravityforms"); ?></option>
                                </select>
                                <div id="address_type_us_container" class="gfield_sub_setting">
                                    <label for="field_address_default_state">
                                        <?php _e("Default State", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_address_default_state") ?>
                                    </label>
                                    <select id="field_address_default_state" onchange="SetAddressProperties();">
                                        <?php echo GFCommon::get_us_state_dropdown() ?>
                                    </select>
                                </div>

                                <div id="address_type_canadian_container" class="gfield_sub_setting">
                                    <label for="field_address_default_province">
                                        <?php _e("Default Province", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_address_default_province") ?>
                                    </label>
                                    <select id="field_address_default_province" onchange="SetAddressProperties();">
                                        <?php echo GFCommon::get_canadian_provinces_dropdown()?>
                                    </select>
                                </div>
                                <div id="address_type_international_container" class="gfield_sub_setting">
                                    <label for="field_address_default_country">
                                        <?php _e("Default Country", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_address_default_country") ?>
                                    </label>
                                    <select id="field_address_default_country" onchange="SetAddressProperties();">
                                        <?php echo GFCommon::get_country_dropdown() ?>
                                    </select>

                                    <div class="gfield_sub_setting">
                                        <input type="checkbox" id="field_address_hide_country" onclick="SetAddressProperties();"/>
                                        <label for="field_address_hide_country" class="inline">
                                            <?php _e("Hide Country Field", "gravityforms"); ?>
                                            <?php gform_tooltip("form_field_address_hide_country") ?>
                                        </label>
                                    </div>
                                </div>

                                <div class="gfield_sub_setting">
                                    <input type="checkbox" id="field_address_hide_address2" onclick="SetAddressProperties();"/>
                                    <label for="field_address_hide_address2" class="inline">
                                        <?php _e("Hide Address Line 2 Field", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_address_hide_address2") ?>
                                    </label>
                                </div>
                            </li>

                            <li class="name_format_setting field_setting">
                                <label for="field_name_format">
                                    <?php _e("Name Format", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_name_format") ?>
                                </label>
                                <select id="field_name_format" onchange="StartChangeNameFormat(jQuery(this).val());">
                                    <option value="normal"><?php _e("Normal", "gravityforms"); ?></option>
                                    <option value="extended"><?php _e("Extended", "gravityforms"); ?></option>
                                    <option value="simple"><?php _e("Simple", "gravityforms"); ?></option>
                                </select>
                            </li>

                            <li class="date_input_type_setting field_setting">
                                <label for="field_date_input_type">
                                    <?php _e("Date Input Type", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_date_input_type") ?>
                                </label>
                                <select id="field_date_input_type" onchange="SetDateInputType(jQuery(this).val());">
                                    <option value="datefield"><?php _e("Date Field", "gravityforms") ?></option>
                                    <option value="datepicker"><?php _e("Date Picker", "gravityforms") ?></option>
                                </select>
                                <div id="date_picker_container">

                                    <input type="radio" id="gsetting_icon_none" name="gsetting_icon" value="none" onclick="SetCalendarIconType(this.value);"/>
                                    <label for="gsetting_icon_none" class="inline">
                                        <?php _e("No Icon", "gravityforms"); ?>
                                    </label>
                                    &nbsp;&nbsp;
                                    <input type="radio" id="gsetting_icon_calendar" name="gsetting_icon" value="calendar" onclick="SetCalendarIconType(this.value);"/>
                                    <label for="gsetting_icon_calendar" class="inline">
                                        <?php _e("Calendar Icon", "gravityforms"); ?>
                                    </label>
                                    &nbsp;&nbsp;
                                    <input type="radio" id="gsetting_icon_custom" name="gsetting_icon" value="custom" onclick="SetCalendarIconType(this.value);"/>
                                    <label for="gsetting_icon_custom" class="inline">
                                        <?php _e("Custom Icon", "gravityforms"); ?>
                                    </label>

                                    <div id="gfield_icon_url_container">
                                        <label for="gfield_calendar_icon_url" class="inline">
                                            <?php _e("Image Path: ", "gravityforms"); ?>
                                        </label>
                                        <input type="text" id="gfield_calendar_icon_url" size="45" onkeyup="SetFieldProperty('calendarIconUrl', this.value);"/>
                                        <div class="instruction"><?php _e("Preview this form to see your custom icon.", "gravityforms") ?></div>
                                    </div>
                                </div>
                            </li>

                            <li class="date_format_setting field_setting">
                                <label for="field_date_format">
                                    <?php _e("Date Format", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_date_format") ?>
                                </label>
                                <select id="field_date_format" onchange="SetDateFormat(jQuery(this).val());">
                                    <option value="mdy">mm/dd/yyyy</option>
                                    <option value="dmy">dd/mm/yyyy</option>
                                </select>
                            </li>

                            <li class="file_extensions_setting field_setting">
                                <label for="field_file_extension">
                                    <?php _e("Allowed file extensions", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_fileupload_allowed_extensions") ?>
                                </label>
                               <input type="text" id="field_file_extension" size="40" onkeyup="SetFieldProperty('allowedExtensions', this.value);"/>
                               <div><small><?php _e("Separated with commas (i.e. jpg, gif, png, pdf)", "gravityforms"); ?></small></div>
                            </li>


                            <li class="phone_format_setting field_setting">
                                <label for="field_phone_format">
                                    <?php _e("Phone Format", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_phone_format") ?>
                                </label>
                                <select id="field_phone_format" onchange="SetFieldPhoneFormat(jQuery(this).val());">
                                    <option value="standard">(###)### - ####</option>
                                    <option value="international"><?php _e("International", "gravityforms"); ?></option>
                                </select>
                            </li>

                            <li class="choices_setting field_setting">
                                <?php _e("Choices", "gravityforms"); ?> <?php gform_tooltip("form_field_choices") ?><br />
                                <div id="gfield_settings_choices_container">
                                    <ul id="field_choices"></ul>
                                </div>

                                <a title="<?php _e("Bulk Add / Predefined Choices" , "gravityforms") ?>" href="#TB_inline?height=500&width=600&inlineId=gfield_bulk_add" class="thickbox button"><?php _e("Bulk Add / Predefined Choices" , "gravityforms") ?></a>

                                <div id="gfield_bulk_add" style="display:none;">
                                    <div>
                                        <?php

                                        $predefined_choices = array(
                                            __("Countries", "gravityforms") => GFCommon::get_countries(),
                                            __("U.S. States", "gravityforms") => GFCommon::get_us_states(),
                                            __("Canadian Province/Territory", "gravityforms") => GFCommon::get_canadian_provinces(),
                                            __("Continents", "gravityforms") => array(__("Africa","gravityforms"),__("Antarctica","gravityforms"),__("Asia","gravityforms"),__("Australia","gravityforms"),__("Europe","gravityforms"),__("North America","gravityforms"),__("South America","gravityforms")),
                                            __("Gender", "gravityforms") => array(__("Male","gravityforms"),__("Female","gravityforms"),__("Prefer Not to Answer","gravityforms")),
                                            __("Age", "gravityforms") => array(__("Under 18","gravityforms"),__("18-24","gravityforms"),__("25-34","gravityforms"),__("35-44","gravityforms"),__("45-54","gravityforms"),__("55-64","gravityforms"),__("65 or Above","gravityforms"),__("Prefer Not to Answer","gravityforms")),
                                            __("Marital Status", "gravityforms") => array(__("Single","gravityforms"),__("Married","gravityforms"),__("Divorced","gravityforms"),__("Widowed","gravityforms")),
                                            __("Employment", "gravityforms") => array(__("Employed Full-Time","gravityforms"),__("Employed Part-Time","gravityforms"),__("Self-employed","gravityforms"),__("Not employed","gravityforms"),__(" but looking for work","gravityforms"),__("Not employed and not looking for work","gravityforms"),__("Homemaker","gravityforms"),__("Retired","gravityforms"),__("Student","gravityforms"),__("Prefer Not to Answer","gravityforms")),
                                            __("Job Type", "gravityforms") => array(__("Full-Time","gravityforms"),__("Part-Time","gravityforms"),__("Per Diem","gravityforms"),__("Employee","gravityforms"),__("Temporary","gravityforms"),__("Contract","gravityforms"),__("Intern","gravityforms"),__("Seasonal","gravityforms")),
                                            __("Industry", "gravityforms") => array(__("Accounting/Finance","gravityforms"),__("Advertising/Public Relations","gravityforms"),__("Aerospace/Aviation","gravityforms"),__("Arts/Entertainment/Publishing","gravityforms"),__("Automotive","gravityforms"),__("Banking/Mortgage","gravityforms"),__("Business Development","gravityforms"),__("Business Opportunity","gravityforms"),__("Clerical/Administrative","gravityforms"),__("Construction/Facilities","gravityforms"),__("Consumer Goods","gravityforms"),__("Customer Service","gravityforms"),__("Education/Training","gravityforms"),__("Energy/Utilities","gravityforms"),__("Engineering","gravityforms"),__("Government/Military","gravityforms"),__("Green","gravityforms"),__("Healthcare","gravityforms"),__("Hospitality/Travel","gravityforms"),__("Human Resources","gravityforms"),__("Installation/Maintenance","gravityforms"),__("Insurance","gravityforms"),__("Internet","gravityforms"),__("Job Search Aids","gravityforms"),__("Law Enforcement/Security","gravityforms"),__("Legal","gravityforms"),__("Management/Executive","gravityforms"),__("Manufacturing/Operations","gravityforms"),__("Marketing","gravityforms"),__("Non-Profit/Volunteer","gravityforms"),__("Pharmaceutical/Biotech","gravityforms"),__("Professional Services","gravityforms"),__("QA/Quality Control","gravityforms"),__("Real Estate","gravityforms"),__("Restaurant/Food Service","gravityforms"),__("Retail","gravityforms"),__("Sales","gravityforms"),__("Science/Research","gravityforms"),__("Skilled Labor","gravityforms"),__("Technology","gravityforms"),__("Telecommunications","gravityforms"),__("Transportation/Logistics","gravityforms"),__("Other","gravityforms")),
                                            __("Income", "gravityforms") => array(__("Under $20,000","gravityforms"),__("$20,000 - $30,000","gravityforms"),__("$30,000 - $40,000","gravityforms"),__("$40,000 - $50,000","gravityforms"),__("$50,000 - $75,000","gravityforms"),__("$75,000 - $100,000","gravityforms"),__("$100,000 - $150,000","gravityforms"),__("$150,000 or more","gravityforms"),__("Prefer Not to Answer","gravityforms")),
                                            __("Education", "gravityforms") => array(__("High School","gravityforms"),__("Associate Degree","gravityforms"),__("Bachelor's Degree","gravityforms"),__("Graduate of Professional Degree","gravityforms"),__("Some College","gravityforms"),__("Other","gravityforms"),__("Prefer Not to Answer","gravityforms")),
                                            __("Days of the Week", "gravityforms") => array(__("Sunday","gravityforms"),__("Monday","gravityforms"),__("Tuesday","gravityforms"),__("Wednesday","gravityforms"),__("Thursday","gravityforms"),__("Friday","gravityforms"),__("Saturday","gravityforms")),
                                            __("Months of the Year", "gravityforms") => array(__("January","gravityforms"),__("February","gravityforms"),__("March","gravityforms"),__("April","gravityforms"),__("May","gravityforms"),__("June","gravityforms"),__("July","gravityforms"),__("August","gravityforms"),__("September","gravityforms"),__("October","gravityforms"),__("November","gravityforms"),__("December","gravityforms")),
                                            __("How Often", "gravityforms") => array(__("Everyday","gravityforms"),__("Once a week","gravityforms"),__("2 to 3 times a week","gravityforms"),__("Once a month","gravityforms"),__(" 2 to 3 times a month","gravityforms"),__("Less than once a month","gravityforms")),
                                            __("How Long", "gravityforms") => array(__("Less than a month","gravityforms"),__("1-6 months","gravityforms"),__("1-3 years","gravityforms"),__("Over 3 Years","gravityforms"),__("Never used","gravityforms")),
                                            __("Satisfaction", "gravityforms") => array(__("Very Satisfied","gravityforms"),__("Satisfied","gravityforms"),__("Neutral","gravityforms"),__("Unsatisfied","gravityforms"),__("Very Unsatisfied","gravityforms")),
                                            __("Importance", "gravityforms") => array(__("Very Important","gravityforms"),__("Important","gravityforms"),__("Somewhat Important","gravityforms"),__("Not Important","gravityforms")),
                                            __("Agreement", "gravityforms") => array(__("Strongly Agree","gravityforms"),__("Agree","gravityforms"),__("Disagree","gravityforms"),__("Strongly Disagree","gravityforms")),
                                            __("Comparison", "gravityforms") => array(__("Much Better","gravityforms"),__("Somewhat Better","gravityforms"),__("About the Same","gravityforms"),__("Somewhat Worse","gravityforms"),__("Much Worse","gravityforms")),
                                            __("Would You", "gravityforms") => array(__("Definitely","gravityforms"),__("Probably","gravityforms"),__("Not Sure","gravityforms"),__("Probably Not","gravityforms"),__("Definitely Not","gravityforms")),
                                            __("Size", "gravityforms") => array(__("Extra Small","gravityforms"),__("Small","gravityforms"),__("Medium","gravityforms"),__("Large","gravityforms"),__("Extra Large","gravityforms")),

                                        );
                                        $predefined_choices = apply_filters("gform_predefined_choices", $predefined_choices);
                                        ?>
                                        <script type="text/javascript">
                                            var gform_predefined_choices = <?php echo GFCommon::json_encode($predefined_choices) ?>;
                                        </script>

                                <div class="panel-instructions">Select a category and customize the predefined choices or paste your own list to bulk add choices.</div>
                                        <div class="bulk-left-panel">
                                            <ul>
                                            <?php
                                            foreach(array_keys($predefined_choices) as $name){
                                                $key = str_replace("'", "\'", $name);
                                            ?>
                                                <li><a href="javascript:void(0);" onclick="jQuery('#gfield_bulk_add_input').val(gform_predefined_choices['<?php echo $key ?>'].join('\n'));" class="bulk-choice"><?php echo $name ?></a>
                                            <?php
                                            }
                                            ?>
                                            </ul>
                                        </div>
                                        <div class="bulk-arrow-mid"></div>
                                        <textarea id="gfield_bulk_add_input"></textarea>
                                        <br style="clear:both;"/>

                                        <div class="panel-buttons">
                                            <input type="button" onclick="InsertBulkChoices(jQuery('#gfield_bulk_add_input').val().split('\n')); tb_remove();" class="button-primary" value="Add Choices">&nbsp;
                                            <input type="button" onclick="tb_remove();" class="button" value="Cancel">
                                        </div>
                                    </div>
                                </div>

                            </li>
                             <li class="description_setting field_setting">
                                <label for="field_description">
                                    <?php _e("Description", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_description") ?>
                                </label>
                                <textarea id="field_description" class="fieldwidth-3  fieldheight-2" onkeyup="SetFieldDescription(this.value);"/></textarea>
                            </li>
                            <li class="rules_setting field_setting">
                                <?php _e("Rules", "gravityforms"); ?><br/>
                                <input type="checkbox" id="field_required" onclick="SetFieldRequired(this.checked);"/>
                                <label for="field_required" class="inline">
                                    <?php _e("Required", "gravityforms"); ?>
                                    <?php gform_tooltip("form_field_required") ?>
                                </label><br/>
                                <div class="duplicate_setting field_setting">
                                    <input type="checkbox" id="field_no_duplicates" onclick="SetFieldProperty('noDuplicates', this.checked);"/>
                                    <label for="field_no_duplicates" class="inline">
                                        <?php _e("No Duplicates", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_no_duplicate") ?>
                                    </label>
                                </div>
                            </li>

                            <li class="range_setting field_setting">
                                <div style="clear:both;"><?php _e("Range", "gravityforms"); ?>
                                <?php gform_tooltip("form_field_number_range") ?>
                                </div>
                                <div style="width:90px; float:left;">
                                <input type="text" id="field_range_min" size="10" onkeyup="SetFieldProperty('rangeMin', this.value);" />
                                    <label for="field_range_min" >
                                        <?php _e("Min", "gravityforms"); ?>
                                    </label>

                                </div>
                                <div style="width:90px; float:left;">
                                <input type="text" id="field_range_max" size="10" onkeyup="SetFieldProperty('rangeMax', this.value);" />
                                    <label for="field_range_max">
                                        <?php _e("Max", "gravityforms"); ?>
                                    </label>

                                </div>
                                <br class="clear" />
                            </li>


                        </ul>
                        </div>
                        <div id="gform_tab_2">
                            <ul>
                                <li class="admin_label_setting field_setting">
                                    <label for="field_admin_label">
                                        <?php _e("Admin Label", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_admin_label") ?>
                                    </label>
                                    <input type="text" id="field_admin_label" size="35" onkeyup="SetFieldProperty('adminLabel', this.value);"/>
                                </li>
                                <li class="size_setting field_setting">
                                    <label for="field_size">
                                        <?php _e("Field Size", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_size") ?>
                                    </label>
                                    <select id="field_size" onchange="SetFieldSize(jQuery(this).val());">
                                        <option value="small"><?php _e("Small", "gravityforms"); ?></option>
                                        <option value="medium"><?php _e("Medium", "gravityforms"); ?></option>
                                        <option value="large"><?php _e("Large", "gravityforms"); ?></option>
                                    </select>
                                </li>
                                <li class="default_value_setting field_setting">
                                    <label for="field_default_value">
                                        <?php _e("Default Value", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_default_value") ?>
                                    </label>
                                    <?php self::insert_variable_prepopulate("field_default_value") ?><br/>
                                    <input type="text" id="field_default_value" class="fieldwidth-2" onkeyup="SetFieldDefaultValue(this.value);"/>
                                </li>
                                <li class="default_value_textarea_setting field_setting">
                                    <label for="field_default_value_textarea">
                                        <?php _e("Default Value", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_default_value") ?>
                                    </label>
                                    <textarea id="field_default_value_textarea" onkeyup="SetFieldDefaultValue(this.value);" class="fieldwidth-3"></textarea>
                                </li>
                                <li class="error_message_setting field_setting">
                                    <label for="field_error_message">
                                        <?php _e("Validation Message", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_validation_message") ?>
                                    </label>
                                    <input type="text" id="field_error_message" class="fieldwidth-2" onkeyup="SetFieldProperty('errorMessage', this.value);"/>
                                </li>
                                <li class="captcha_language_setting field_setting">
                                    <label for="field_captcha_language">
                                        <?php _e("Language", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_recaptcha_language") ?>
                                    </label>
                                    <select id="field_captcha_language" onchange="SetFieldProperty('captchaLanguage', this.value);">
                                        <option value="en"><?php _e("English", "gravityforms"); ?></option>
                                        <option value="nl"><?php _e("Dutch", "gravityforms"); ?></option>
                                        <option value="fr"><?php _e("French", "gravityforms"); ?></option>
                                        <option value="de"><?php _e("German", "gravityforms"); ?></option>
                                        <option value="pt"><?php _e("Portuguese", "gravityforms"); ?></option>
                                        <option value="ru"><?php _e("Russian", "gravityforms"); ?></option>
                                        <option value="es"><?php _e("Spanish", "gravityforms"); ?></option>
                                        <option value="tr"><?php _e("Turkish", "gravityforms"); ?></option>
                                    </select>
                                </li>
                                <li class="css_class_setting field_setting">
                                    <label for="field_css_class">
                                        <?php _e("CSS Class Name", "gravityforms"); ?>
                                        <?php gform_tooltip("form_field_css_class") ?>
                                    </label>
                                    <input type="text" id="field_css_class" size="30" onkeyup="SetFieldProperty('cssClass', this.value);"/>
                                </li>
                                <li class="visibility_setting field_setting">
                                    <label><?php _e("Visibility", "gravityforms"); ?> <?php gform_tooltip("form_field_visibility") ?></label>
                                    <div>
                                        <input type="radio" name="field_visibility" id="field_visibility_everyone" size="10" onclick="SetFieldAdminOnly(!this.checked);" />
                                        <label for="field_visibility_everyone" class="inline">
                                            <?php _e("Everyone", "gravityforms"); ?>
                                        </label>
                                        &nbsp;&nbsp;
                                        <input type="radio" name="field_visibility" id="field_visibility_admin" size="10" onclick="SetFieldAdminOnly(this.checked);" />
                                        <label for="field_visibility_admin" class="inline">
                                            <?php _e("Admin Only", "gravityforms"); ?>
                                        </label>
                                    </div>
                                    <br class="clear" />
                                </li>
                                <li class="prepopulate_field_setting field_setting">
                                    <input type="checkbox" id="field_prepopulate" onclick="SetFieldProperty('allowsPrepopulate', this.checked); ToggleInputName()"/> <label for="field_prepopulate" class="inline"><?php _e("Allow field to be populated dynamically", "gravityforms") ?><?php gform_tooltip("form_field_prepopulate") ?></label>
                                    <br/>
                                    <div id="field_input_name_container" style="display:none; padding-top:10px;">
                                        <!-- content dynamically created from js.php -->
                                    </div>
                                </li>
                                <li class="conditional_logic_field_setting field_setting">
                                    <input type="checkbox" id="field_conditional_logic" onclick="SetFieldProperty('conditionalLogic', this.checked ? new ConditionalLogic() : null); ToggleConditionalLogic();"/> <label for="field_conditional_logic" class="inline"><?php _e("Enable Conditional Logic", "gravityforms") ?><?php gform_tooltip("form_field_conditional_logic") ?></label>
                                    <br/>
                                    <div id="field_conditional_logic_container" style="display:none; padding-top:10px;">
                                        <!-- content dynamically created from js.php -->
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </td>
                <td valign="top" align="right">
                    <div id="add_fields" style="text-align:left; width:285px; padding:0 20px 0 15px;">
                        <div id="floatMenu">
                        <h3><?php _e("Add Fields", "gravityforms"); ?></h3>

                        <!-- begin add button boxes -->


                        <ul id="sidebarmenu1" class="menu collapsible expandfirst">
                    <li id="add-standard-buttons">

                        <div class="button-title-link"><div class="add-buttons-title"><?php _e("Standard Fields", "gravityforms"); ?> <?php gform_tooltip("form_standard_fields", "tooltip_left") ?></div></div>

                        <ul>
                            <li class="add-buttons">
                                <ol class="field_type">
                                    <li><input type="button" class="button" value="<?php _e("Single Line Text", "gravityforms"); ?>" onclick="StartAddField('text');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Paragraph Text", "gravityforms"); ?>" onclick="StartAddField('textarea');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Drop Down", "gravityforms"); ?>" onclick="StartAddField('select');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Number", "gravityforms"); ?>" onclick="StartAddField('number');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Checkboxes", "gravityforms"); ?>" onclick="StartAddField('checkbox');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Multiple Choice", "gravityforms"); ?>" onclick="StartAddField('radio');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Section Break", "gravityforms"); ?>" onclick="StartAddField('section');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Hidden", "gravityforms"); ?>" onclick="StartAddField('hidden');"/></li>
                                </ol>
                            </li>
                        </ul>
                    </li>
                    <li id="add-advanced-buttons">

                        <div class="button-title-link"><div class="add-buttons-title"><?php _e("Advanced Fields", "gravityforms"); ?> <?php gform_tooltip("form_advanced_fields", "tooltip_left") ?></div></div>

                        <ul>
                            <li class="add-buttons">

                                <ol class="field_type">
                                    <li><input type="button" class="button" value="<?php _e("Name", "gravityforms"); ?>" onclick="StartAddField('name');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Date", "gravityforms"); ?>" onclick="StartAddField('date');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Time", "gravityforms"); ?>" onclick="StartAddField('time');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Phone", "gravityforms"); ?>" onclick="StartAddField('phone');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Address", "gravityforms"); ?>" onclick="StartAddField('address');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Website", "gravityforms"); ?>" onclick="StartAddField('website');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Email", "gravityforms"); ?>" onclick="StartAddField('email');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("File Upload", "gravityforms"); ?>" onclick="StartAddField('fileupload');"/></li>
                                    <li><input type="button" class="button" value="reCAPTCHA" onclick="AddCaptchaField();"/></li>
                                </ol>
                            </li>
                        </ul>
                    </li>
                    <li id="add-post-buttons">

                        <div class="button-title-link"><div class="add-buttons-title"><?php _e("Post Fields", "gravityforms"); ?> <?php gform_tooltip("form_post_fields", "tooltip_left") ?></div></div>

                        <ul>
                            <li class="add-buttons">

                                <ol class="field_type">
                                    <li><input type="button" class="button" value="<?php _e("Title", "gravityforms"); ?>" onclick="StartAddField('post_title');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Body", "gravityforms"); ?>" onclick="StartAddField('post_content');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Excerpt", "gravityforms"); ?>" onclick="StartAddField('post_excerpt');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Tags", "gravityforms"); ?>" onclick="StartAddField('post_tags');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Category", "gravityforms"); ?>" onclick="StartAddField('post_category');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Image", "gravityforms"); ?>" onclick="StartAddField('post_image');"/></li>
                                    <li><input type="button" class="button" value="<?php _e("Custom Field", "gravityforms"); ?>" onclick="StartAddField('post_custom_field');"/></li>
                                </ol>
                            </li>
                        </ul>
                    </li>
                    </ul>
                    <br style="clear:both;"/>
                    <!--end add button boxes -->
                </div>
                    </div>
                </td>
            </tr>
        </table>
        </div>

        <?php
        require_once(GFCommon::get_base_path() . "/js.php");
    }


    //Hierarchical category functions copied from WordPress core and modified.
    private static function _cat_rows( $categories, &$count, &$output, $parent = 0, $level = 0, $page = 1, $per_page = 9999999 ) {
        if ( empty($categories) ) {
            $args = array('hide_empty' => 0);
            if ( !empty($_POST['search']) )
                $args['search'] = $_POST['search'];
            $categories = get_categories( $args );
        }

        if ( !$categories )
            return false;

        $children = self::_get_term_hierarchy('category');

        $start = ($page - 1) * $per_page;
        $end = $start + $per_page;
        $i = -1;
        foreach ( $categories as $category ) {
            if ( $count >= $end )
                break;

            $i++;

            if ( $category->parent != $parent )
                continue;

            // If the page starts in a subtree, print the parents.
            if ( $count == $start && $category->parent > 0 ) {
                $my_parents = array();
                while ( $my_parent) {
                    $my_parent = get_category($my_parent);
                    $my_parents[] = $my_parent;
                    if ( !$my_parent->parent )
                        break;
                    $my_parent = $my_parent->parent;
                }
                $num_parents = count($my_parents);
                while( $my_parent = array_pop($my_parents) ) {
                    self::_cat_row( $my_parent, $level - $num_parents, $output );
                    $num_parents--;
                }
            }

            if ( $count >= $start )
                self::_cat_row( $category, $level, $output );

            unset($categories[$i]); // Prune the working set
            $count++;

            if ( isset($children[$category->term_id]) )
                self::_cat_rows( $categories, $count, $output, $category->term_id, $level + 1, $page, $per_page );

    }
}
    private static function _cat_row( $category, $level, &$output, $name_override = false ) {
        static $row_class = '';

        $cat = get_category( $category, OBJECT, 'display' );

        $default_cat_id = (int) get_option( 'default_category' );
        $pad = str_repeat( '&#8212; ', $level );
        $name = ( $name_override ? $name_override : $pad . ' ' . $cat->name );

        $cat->count = number_format_i18n( $cat->count );

        $output .="
        <tr class='author-self status-inherit' valign='top'>
            <th scope='row' class='check-column'><input type='checkbox' class='gfield_category_checkbox' value='$cat->term_id' name='" . esc_attr($cat->name) . "' onclick='SetSelectedCategories();' /></th>
            <td class='gfield_category_cell'>$name</td>
        </tr>";
    }
    private static function _get_term_hierarchy($taxonomy) {
        if ( !is_taxonomy_hierarchical($taxonomy) )
            return array();
        $children = get_option("{$taxonomy}_children");
        if ( is_array($children) )
            return $children;

        $children = array();
        $terms = get_terms($taxonomy, 'get=all');
        foreach ( $terms as $term ) {
            if ( $term->parent > 0 )
                $children[$term->parent][] = $term->term_id;
        }
        update_option("{$taxonomy}_children", $children);

        return $children;
    }


    private static function insert_variable_prepopulate($element_id){
        ?>
        <select id="<?php echo $element_id?>_variable_select" onchange="InsertVariable('<?php echo $element_id?>'); SetFieldDefaultValue(jQuery('#<?php echo $element_id?>').val());">
            <option value=''><?php _e("Insert variable", "gravityforms"); ?></option>

            <option value='{ip}'><?php _e("Client IP Address", "gravityforms"); ?></option>
            <option value='{date_mdy}'><?php _e("Date", "gravityforms"); ?> (mm/dd/yyyy)</option>
            <option value='{date_dmy}'><?php _e("Date", "gravityforms"); ?> (dd/mm/yyyy)</option>
            <option value='{embed_post:ID}'><?php _e("Embed Post/Page Id", "gravityforms"); ?></option>
            <option value='{embed_post:post_title}'><?php _e("Embed Post/Page Title", "gravityforms"); ?></option>
            <option value='{embed_url}'><?php _e("Embed URL", "gravityforms"); ?></option>
            <option value='{user_agent}'><?php _e("HTTP User Agent", "gravityforms"); ?></option>
            <option value='{referer}'><?php _e("HTTP Referer URL", "gravityforms"); ?></option>
            <option value='{user:display_name}'><?php _e("User Display Name", "gravityforms"); ?></option>
            <option value='{user:user_email}'><?php _e("User Email", "gravityforms"); ?></option>
            <option value='{user:user_login}'><?php _e("User Login", "gravityforms"); ?></option>
        <?php
    }

    //Ajax calls
    public static function add_field(){
        check_ajax_referer("rg_add_field", "rg_add_field");
        $field_json = stripslashes_deep($_POST["field"]);
        $field = GFCommon::json_decode($field_json, true);

        require_once(GFCommon::get_base_path() . "/form_display.php");
        $field_html = GFFormDisplay::get_field($field, "", true);

        die("EndAddField($field_json, \"$field_html\");");
    }

    public static function delete_field(){
        check_ajax_referer("rg_delete_field", "rg_delete_field");
        $form_id =  intval($_POST["form_id"]);
        $field_id =  intval($_POST["field_id"]);

        RGFormsModel::delete_field($form_id, $field_id);
        die("EndDeleteField($field_id);");
    }

    public static function change_input_type(){
        check_ajax_referer('rg_change_input_type','rg_change_input_type');
        $field_json = stripslashes_deep($_POST["field"]);
        $field = GFCommon::json_decode($field_json, true);
        $id = $field["id"];
        $type = $field["inputType"];

        require_once(GFCommon::get_base_path() . "/form_display.php");
        $field_content = GFFormDisplay::get_field_content($field, "");

        die("EndChangeInputType('$id', '$type', \"$field_content\");");
    }

    public static function save_form(){
        global $wpdb;
        check_ajax_referer('rg_save_form', 'rg_save_form');
        $id = $_POST["id"];

        $form_json = $_POST["form"];

        $form_json = stripslashes($form_json);

        $form_meta = GFCommon::json_decode($form_json, true);
        $form_table_name =  $wpdb->prefix . "rg_form";
        $meta_table_name =  $wpdb->prefix . "rg_form_meta";

        //Making sure title is not duplicate
        $forms = RGFormsModel::get_forms();
        foreach($forms as $form)
            if(strtolower($form->title) == strtolower($form_meta["title"]) && $form_meta["id"] != $form->id)
                die('DuplicateTitleMessage();');

        if($id > 0){
            RGFormsModel::update_form_meta($id, $form_meta);

            //updating form title
            $wpdb->query($wpdb->prepare("UPDATE $form_table_name SET title=%s WHERE id=%d", $form_meta["title"], $form_meta["id"]));

            die("EndUpdateForm($id);");
        }
        else{
            //inserting form
            $id = RGFormsModel::insert_form($form_meta["title"]);

            //updating object's id property
            $form_meta["id"] = $id;

            //updating form meta
            RGFormsModel::update_form_meta($id, $form_meta);

            die("EndInsertForm($id);");
        }
    }
}
?>