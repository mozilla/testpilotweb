<?php
class GFHelp{
    public static function help_page(){
        if(!GFCommon::ensure_wp_version())
                return;

            echo GFCommon::get_remote_message();

            ?>
            <link rel="stylesheet" href="<?php echo GFCommon::get_base_url()?>/css/admin.css" />
            <div class="wrap">
                <img alt="<?php _e("Gravity Forms", "gravityforms") ?>" style="margin: 15px 7px 0pt 0pt; float: left;" src="<?php echo GFCommon::get_base_url() ?>/images/gravity-title-icon-32.png"/>
                <h2><?php _e("Gravity Forms Help", "gravityforms"); ?></h2>

                <div style="margin-top:10px;">
                <h3><?php _e("Embedding a form", "gravityforms"); ?></h3>
                <?php _e("There are two ways to embed a form to a post or page.", "gravityforms"); ?>
                <ul style="margin-top:15px;">
                    <li>
                        <strong><?php _e("Shortcode:", "gravityforms"); ?></strong>
                        <div style="padding:6px;">
                            <?php _e("Add the following shortcode to your page or post", "gravityforms"); ?><br/><br/>

                            <div class="gforms_code">[gravityform id=2 title=false description=false]</div>

                            <strong><?php _e("id", "gravityforms"); ?>:</strong> <?php _e("(Required) The id of the form to be embedded", "gravityforms"); ?><br/>
                            <strong><?php _e("title", "gravityforms"); ?>:</strong> <?php _e("(Optional) Whether or not do display the form title. Defaults to 'false'", "gravityforms"); ?><br/>
                            <strong><?php _e("description", "gravityforms"); ?>:</strong> <?php _e("(Optional) Whether or not do display the form description. Defaults to 'false'", "gravityforms"); ?><br/>
                        </div>
                    </li>
                    <li>
                        <strong>Function:</strong>
                        <div style="padding:6px;">
                            <?php _e("Add the following function call to your template", "gravityforms"); ?><br/><br/>
                            <div class="gforms_code">&lt;?php gravity_form(2, false, false); ?&gt;</div>
                            <strong><?php _e("Parameter 1 (id)", "gravityforms"); ?>:</strong> <?php _e("(Required) The id of the form to be embedded", "gravityforms"); ?><br/>
                            <strong><?php _e("Parameter 2 (title)", "gravityforms"); ?>:</strong> <?php _e("(Optional) Whether or not do display the form title. Defaults to 'false'", "gravityforms"); ?><br/>
                            <strong><?php _e("Parameter 3(description)", "gravityforms"); ?>:</strong> <?php _e("(Optional) Whether or not do display the form description. Defaults to 'false'", "gravityforms"); ?><br/>
                        </div>
                    </li>
                </ul>

                <div class="hr-divider"></div>

                <h3><?php _e("Action Hooks and Filters", "gravityforms"); ?></h3>
                <?php _e("The following hooks and filters allow developers to integrate Gravity Forms with other plugins.", "gravityforms"); ?>
                <ul style="margin-top:15px;">
                    <li>
                        <strong>gform_pre_submission</strong>
                        <div style="padding:6px;">
                            <?php _e("This action hook runs during form submission after validation has taken place and before entry data has been saved", "gravityforms"); ?><br/><br/>

                            <strong><?php _e("Sample", "gravityforms"); ?></strong>:<br/>
                            <div class="gforms_code"><pre>
add_action("gform_pre_submission", "pre_submission_handler");
function pre_submission_handler($form_meta){

   //displaying form title
   echo "Form Title: " . $form_meta["title"] . "&lt;br/>";

   //displaying all submitted fields
   foreach($form_meta["fields"] as $field){

       if(is_array($field["inputs"])){

           //handling multi-input fields such as name and address
           foreach($field["inputs"] as $input){
               $value = stripslashes($_POST["input_" . str_replace('.', '_', $input["id"])]);
               echo $input["label"] . ": " . $value .  "&lt;br/>";
           }
       }
       else{
           //handling single-input fields such as text and paragraph (textarea)
           $value = stripslashes($_POST["input_" . $field["id"]]);
           echo $field["label"] . ": " . $value .  "&lt;br/>";
       }
   }
}</pre></div>

                        </div>
                    </li>
                    <li>
                        <strong>gform_post_submission</strong>
                        <div style="padding:6px;">
                            <?php _e("This action hook runs after entry data has been saved", "gravityforms"); ?><br/><br/>

                            <strong><?php _e("Sample", "gravityforms"); ?></strong>:<br/>
                            <div class="gforms_code"><pre>
add_action("gform_post_submission", "post_submission_handler");
function post_submission_handler($entry){
   global $wpdb;

   $results = $wpdb->get_results($wpdb->prepare("  SELECT l.*, field_number, value
                           FROM wp_rg_lead l
                           INNER JOIN wp_rg_lead_detail ld ON l.id = ld.lead_id
                           WHERE l.id=%d
                           ORDER BY  l.id, field_number", $entry["id"]));

   foreach($results as $result){
       echo "&lt;hr/>Entry Id: " . $result->id . "&lt;br/>";
       echo "Field Number: " . $result->field_number . "&lt;br/>";
       echo "Field Value: " . $result->value . "&lt;br/>";
   }
}</pre></div>
                        </div>
                    </li>

                    <li>
                        <strong>gform_submit_button</strong>
                        <div style="padding:6px;">
                            <?php _e("Filters the form submit buton", "gravityforms"); ?><br/><br/>

                            <strong><?php _e("Sample", "gravityforms"); ?></strong>:<br/>
                            <div class="gforms_code"><pre>
add_filter("gform_submit_button", "form_submit_button");
function form_submit_button($button){
   return "&lt;input type='submit' value='My new button' />";
}</pre></div>
                        </div>
                    </li>

                    <li>
                        <strong>gform_submit_button_FORMID</strong>
                        <div style="padding:6px;">
                            <?php _e("Same as gform_submit_button, but it only applies to the specified form", "gravityforms"); ?>.<br/><br/>

                            <strong><?php _e("Sample", "gravityforms"); ?></strong>:<br/>
                            <div class="gforms_code"><pre>
add_filter("gform_submit_button_75", "form_75_submit_button");
function form_75_submit_button($button){
   return "&lt;input type='submit' value='Button for form 75' />";
}</pre></div>
                        </div>
                    </li>
                </ul>

                </div>
            </div>

            
            <?php
    }
}
?>