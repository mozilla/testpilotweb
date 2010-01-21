<?php
class GFExport{
    public static function export_page(){
        if(!GFCommon::ensure_wp_version())
            return;

        echo GFCommon::get_remote_message();

        ?>
            <script type='text/javascript' src='<?php echo GFCommon::get_base_url()?>/js/jquery-ui/ui.datepicker.js'></script><link rel='stylesheet' href='<?php echo GFCommon::get_base_url() ?>/css/datepicker.css' type='text/css' />
            <script type="text/javascript">
                function SelectExportForm(formId){
                    if(!formId)
                        return;

                    var mysack = new sack("<?php bloginfo( 'wpurl' ); ?>/wp-admin/admin-ajax.php" );
                    mysack.execute = 1;
                    mysack.method = 'POST';
                    mysack.setVar( "action", "rg_select_export_form" );
                    mysack.setVar( "rg_select_export_form", "<?php echo wp_create_nonce("rg_select_export_form") ?>" );
                    mysack.setVar( "form_id", formId);
                    mysack.encVar( "cookie", document.cookie, false );
                    mysack.onError = function() { alert('<?php _e("Ajax error while selecting a form", "gravityforms") ?>' )};
                    mysack.runAJAX();

                    return true;
                }

                function EndSelectExportForm(aryFields){
                    if(aryFields.length == 0)
                    {
                        jQuery("#export_field_container, #export_date_container, #export_submit_container").hide()
                        return;
                    }

                    var fieldList = "<li><input type='checkbox' onclick=\"jQuery('.gform_export_field').attr('checked', this.checked); jQuery('#gform_export_check_all').html(this.checked ? '<strong><?php _e("Deselect All", "gravityforms") ?></strong>' : '<strong><?php _e("Select All", "gravityforms") ?></strong>'); \"> <label id='gform_export_check_all'><strong><?php _e("Select All", "gravityforms") ?></strong></label></li>";
                    for(var i=0; i<aryFields.length; i++){
                        fieldList += "<li><input type='checkbox' id='export_field_" + i + "' name='export_field[]' value='" + aryFields[i][0] + "' class='gform_export_field'> <label for='export_field_" + i + "'>" + aryFields[i][1] + "</label></li>";
                    }
                    jQuery("#export_field_list").html(fieldList);
                    jQuery("#export_date_start, #export_date_end").datepicker({dateFormat: 'yy-mm-dd'});

                    jQuery("#export_field_container, #export_date_container, #export_submit_container").hide().show();
                }
                function StartExport(){

                    jQuery("#please_wait_container").show();
                    jQuery("#export_button").attr("disabled", "disabled");

                    var formId = jQuery("#export_form").val();
                    var fields = ""
                    jQuery(".gform_export_field").each(
                        function (){
                            if(this.checked)
                                fields += this.value + ",";
                        }
                    );

                    if(fields.length > 0)
                        fields = fields.substr(0, fields.length -1);

                    var startDate = jQuery("#export_date_start").val();
                    var endDate = jQuery("#export_date_end").val();

                    var mysack = new sack("<?php bloginfo( 'wpurl' ); ?>/wp-admin/admin-ajax.php" );
                    mysack.execute = 1;
                    mysack.method = 'POST';
                    mysack.setVar( "action", "rg_start_export" );
                    mysack.setVar( "rg_start_export", "<?php echo wp_create_nonce("rg_start_export") ?>" );
                    mysack.setVar( "form_id", formId);
                    mysack.setVar( "fields", fields);
                    mysack.setVar( "start_date", startDate);
                    mysack.setVar( "end_date", endDate);

                    mysack.encVar( "cookie", document.cookie, false );
                    mysack.onError = function() { alert('<?php _e("Ajax error while exporting.", "gravityforms") ?>' )};
                    mysack.runAJAX();

                    return true;
                }

                function EndExport(formId, isSuccess, value){
                    if(!isSuccess)
                    {
                        alert(value);
                        return;
                    }

                    jQuery("#please_wait_container").hide();
                    jQuery("#export_button").removeAttr("disabled");
                    jQuery("#export_frame").attr("src", "<?php echo GFCommon::get_base_url() ?>/download.php?form_id=" + formId + "&f=" + value);

                }

            </script>
            <link rel="stylesheet" href="<?php echo GFCommon::get_base_url()?>/css/admin.css"/>
            <div class="wrap">
                <img alt="<?php _e("Gravity Forms", "gravityforms") ?>" style="margin: 15px 7px 0pt 0pt; float: left;" src="<?php echo GFCommon::get_base_url() ?>/images/gravity-title-icon-32.png"/>
                <h2><?php _e("Export Form Entries", "gravityforms") ?></h2>

                <form method="post" style="margin-top:10px;">

                   <table class="form-table">
                      <tr valign="top">
                           <th scope="row"><label for="export_form"><?php _e("Select A Form", "gravityforms"); ?></label> <?php gform_tooltip("export_select_form") ?></th>
                            <td>

                              <select id="export_form" name="export_form" onchange="SelectExportForm(jQuery(this).val());">
                                <option value=""><?php _e("Select a form", "gravityforms"); ?></option>
                                <?php
                                $forms = RGFormsModel::get_forms();
                                foreach($forms as $form){
                                    ?>
                                    <option value="<?php echo absint($form->id) ?>"><?php echo esc_html($form->title) ?></option>
                                    <?php
                                }
                                ?>
                            </select>

                            </td>
                        </tr>
                      <tr id="export_field_container" valign="top" style="display: none;">
                           <th scope="row"><label for="export_fields"><?php _e("Select Fields", "gravityforms"); ?></label> <?php gform_tooltip("export_select_fields") ?></th>
                            <td>
                                <ul id="export_field_list">
                                <ul>
                            </td>
                       </tr>
                      <tr id="export_date_container" valign="top" style="display: none;">
                           <th scope="row"><label for="export_date"><?php _e("Select Date Range", "gravityforms"); ?></label> <?php gform_tooltip("export_date_range") ?></th>
                            <td>
                                <div>
                                    <span style="width:150px; float:left; ">
                                        <input type="text" id="export_date_start" name="export_date_start" style="width:90%"/>
                                        <strong><label for="export_date_start" style="display:block;"><?php _e("Start", "gravityforms"); ?></label></strong>
                                    </span>

                                    <span style="width:150px; float:left;">
                                        <input type="text" id="export_date_end" name="export_date_end" style="width:90%"/>
                                        <strong><label for="export_date_end" style="display:block;"><?php _e("End", "gravityforms"); ?></label></strong>
                                    </span>
                                    <div style="clear: both;"></div>
                                    <?php _e("Date Range is optional, if no date range is selected all entries will be exported.", "gravityforms"); ?>
                                </div>
                            </td>
                       </tr>
                    </table>
                    <ul>
                        <li id="export_submit_container" style="display:none; clear:both;">
                            <br/><br/>
                            <input type="button" id="export_button" name="export" value="<?php _e("Download Export File", "gravityforms"); ?>" class="button-primary" onclick="StartExport();"/>
                            <span id="please_wait_container" style="display:none; margin-left:15px;">
                                <img src="<?php echo GFCommon::get_base_url()?>/images/loading.gif"> <?php _e("Exporting entries. Please wait...", "gravityforms"); ?>
                            </span>

                            <iframe id="export_frame" width="1" height="1" src="about:blank"></iframe>
                        </li>
                    </ul>
                </form>
            </div>
        <?php


    }

    public static function start_export(){
        check_ajax_referer("rg_start_export", "rg_start_export");
        $form_id=$_POST["form_id"];
        $fields = explode(",", $_POST["fields"]);
        $start_date = $_POST["start_date"];
        $end_date = $_POST["end_date"];

        $form = RGFormsModel::get_form_meta($form_id);
        //adding default fields
        array_push($form["fields"],array("id" => "date_created" , "label" => __("Entry Date", "gravityforms")));
        array_push($form["fields"],array("id" => "ip" , "label" => __("User IP", "gravityforms")));
        array_push($form["fields"],array("id" => "source_url" , "label" => __("Source Url", "gravityforms")));

        $entry_count = RGFormsModel::get_lead_count($form_id, "", null, null, $start_date, $end_date);
        $page_size = 2;
        $offset = 0;

        $upload_dir = RGFormsModel::get_upload_path($form_id);

        if(!wp_mkdir_p($upload_dir))
            die("EndExport($form_id, false, " . __('Could not create export folder. Make sure your /wp-content/uploads folder is writable', "gravityforms") . ")");

        $file_name = "export_" . time() . ".csv";
        $file_path = $upload_dir . "/$file_name";
        $fp = fopen($file_path, "w");

        //writing header
        foreach($fields as $field_id){
            $field = RGFormsModel::get_field($form, $field_id);
            $value = '"' . str_replace('"', '""', GFCommon::get_label($field, $field_id)) . '"';
            $lines .= "$value,";
        }
        $lines = substr($lines, 0, strlen($lines)-1) . "\n";

        //paging through results for memory issues
        while($entry_count > 0){
            $leads = RGFormsModel::get_leads($form_id,"date_created", "DESC", "", $offset, $page_size, null, null, false, $start_date, $end_date);

            foreach($leads as $lead){
                foreach($fields as $field_id){
                    $long_text = "";
                    if(strlen($lead[$field_id]) >= GFORMS_MAX_FIELD_LENGTH)
                        $long_text = RGFormsModel::get_field_value_long($lead["id"], $field_id);

                    $value = !empty($long_text) ? $long_text : $lead[$field_id];
                    
                    $lines .= '"' . str_replace('"', '""', $value) . '",';
                }
                $lines = substr($lines, 0, strlen($lines)-1);
                $lines.= "\n";
            }

            $offset += $page_size;
            $entry_count -= $page_size;

            //writing to output
            fwrite($fp, $lines);
            $lines = "";
        }
        fclose($fp);

        die("EndExport($form_id, true, '$file_name');");
    }

}
?>