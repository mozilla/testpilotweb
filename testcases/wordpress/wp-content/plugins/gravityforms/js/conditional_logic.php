<?php
require_once (preg_replace("/wp-content.*/","wp-blog-header.php",__FILE__));

$expires_offset = 31536000;
header('Content-Type: application/x-javascript; charset=UTF-8');
header('Expires: ' . gmdate( "D, d M Y H:i:s", time() + $expires_offset ) . ' GMT');
header("Cache-Control: public, max-age=$expires_offset");

$form_id = $_REQUEST["form_id"];

$form = RGFormsModel::get_form_meta($form_id);
$logics = "";
$dependents = "";
$fields_with_logic = array();
foreach($form["fields"] as $field){

    //use section's logic if one exists
    $section = RGFormsModel::get_section($form, $field["id"]);
    $section_logic = !empty($section) ? $section["conditionalLogic"] : null;

    $logic = $field["conditionalLogic"];

    if(!empty($logic)){
        $field_section_logic = array("field" => $logic, "section" => $section_logic);
        $logics .= $field["id"] . ": " . GFCommon::json_encode($field_section_logic) . ",";
        $fields_with_logic[] = $field["id"];

        $peers = $field["type"] == "section" ? GFCommon::get_section_fields($form, $field["id"]) : array($field);
        $peer_ids = array();

        foreach ($peers as $peer)
            $peer_ids[] = $peer["id"];

        $dependents .= $field["id"] . ": " . GFCommon::json_encode($peer_ids) . ",";
    }
}

if(!empty($logics))
    $logics = substr($logics, 0, strlen($logics) - 1); //removing last comma;

if(!empty($dependents))
    $dependents = substr($dependents, 0, strlen($dependents) - 1); //removing last comma;
?>
jQuery(document).ready(
    function(){
        gf_apply_rules(<?php echo $form_id ?>, <?php echo GFCommon::json_encode($fields_with_logic); ?>);
        jQuery('#gform_wrapper_<?php echo $form_id ?>').show();
    }
);

if(!window["gf_form_conditional_logic"])
    window["gf_form_conditional_logic"] = new Array();

window["gf_form_conditional_logic"][<?php echo $form_id ?>] = {'logic' : {<?php echo $logics ?>}, 'dependents' : {<?php echo $dependents ?>}};

<?php exit; ?>