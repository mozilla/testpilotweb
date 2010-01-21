
function gf_apply_rules(formId, fields){
    for(var i=0; i < fields.length; i++)
        gf_apply_field_rule(formId, fields[i]);
}

function gf_apply_field_rule(formId, fieldId){
    var conditionalLogic = window["gf_form_conditional_logic"][formId]["logic"][fieldId];

    var action = gf_get_field_action(formId, conditionalLogic["section"]);

    //If section is hidden, always hide field. If section is displayed, see if field is supposed to be displayed or hidden
    if(action != "hide")
        action = gf_get_field_action(formId, conditionalLogic["field"]);

    gf_do_field_action(formId, action, fieldId);
}

function gf_get_field_action(formId, conditionalLogic){
    if(!conditionalLogic)
        return "show";

    var matches = 0;
    for(var i = 0; i < conditionalLogic["rules"].length; i++){
        var rule = conditionalLogic["rules"][i];
        if( (rule["operator"] == "is" && gf_is_value_selected(formId, rule["fieldId"], rule["value"])) || (rule["operator"] == "isnot" && !gf_is_value_selected(formId, rule["fieldId"], rule["value"])) )
            matches++;
    }

    var action;
    if( (conditionalLogic["logicType"] == "all" && matches == conditionalLogic["rules"].length) || (conditionalLogic["logicType"] == "any"  && matches > 0) )
        action = conditionalLogic["actionType"];
    else
        action = conditionalLogic["actionType"] == "show" ? "hide" : "show";

    return action;
}

function gf_is_value_selected(formId, fieldId, value){
    var inputs = jQuery("#input_" + formId + "_" + fieldId + " input");
    if(inputs.length > 0){
        for(var i=0; i< inputs.length; i++){
            if(jQuery(inputs[i]).val() == value && jQuery(inputs[i]).is(":checked"))
                return true;
        }
    }
    else{
        if(jQuery("#input_" + formId + "_" + fieldId).val() == value)
            return true;
    }

    return false;
}

function gf_do_field_action(formId, action, fieldId){
    var dependent_fields = window["gf_form_conditional_logic"][formId]["dependents"][fieldId];
    for(var i=0; i < dependent_fields.length; i++){
        if(action == "show"){
            jQuery("#field_" + formId + "_" + dependent_fields[i]).show();
        }
        else{
            jQuery("#field_" + formId + "_" + dependent_fields[i]).hide();
        }
    }
}
