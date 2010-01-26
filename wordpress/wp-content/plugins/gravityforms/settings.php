<?php
class GFSettings{
    public static function settings_page(){
        global $wpdb;

        if(!GFCommon::ensure_wp_version())
            return;

        if($_POST["submit"]){
            check_admin_referer('gforms_update_settings', 'gforms_update_settings');

            if(!GFCommon::current_user_can_any("gravityforms_edit_settings"))
                die(__("You don't have adequate permission to edit settings.", "gravityforms"));

            RGFormsModel::save_key($_POST["gforms_key"]);
            update_option("rg_gforms_disable_css", $_POST["gforms_disable_css"]);
            update_option("rg_gforms_captcha_public_key", $_POST["gforms_captcha_public_key"]);
            update_option("rg_gforms_captcha_private_key", $_POST["gforms_captcha_private_key"]);

            //Updating message because key could have been changed
            GFCommon::cache_remote_message();
        }
        else if($_POST["uninstall"]){

            if(!GFCommon::current_user_can_any("gravityforms_uninstall"))
                die(__("You don't have adequate permission to uninstall Gravity Forms.", "gravityforms"));

            //droping all tables
            RGFormsModel::drop_tables();

            //removing options
            delete_option("rg_form_version");
            delete_option("rg_gforms_key");
            delete_option("rg_gforms_disable_css");
            delete_option("rg_gforms_captcha_public_key");
            delete_option("rg_gforms_captcha_private_key");

            //removing gravity forms upload folder
            GFCommon::delete_directory(RGFormsModel::get_upload_root());

            //Deactivating plugin
            $plugin = "gravityforms/gravityforms.php";
            deactivate_plugins($plugin);
            update_option('recently_activated', array($plugin => time()) + (array)get_option('recently_activated'));

            ?>
            <div class="updated fade" style="padding:20px;"><?php _e(sprintf("Gravity Forms have been successfully uninstalled. It can be re-activated from the %splugins page%s.", "<a href='plugins.php'>","</a>"), "gravityforms")?></div>
            <?php
            return;
        }

        echo GFCommon::get_remote_message();

        ?>
            <link rel="stylesheet" href="<?php echo GFCommon::get_base_url()?>/css/admin.css" />
            <div class="wrap">
                <form method="post">
                    <?php wp_nonce_field('gforms_update_settings', 'gforms_update_settings') ?>
                    <img alt="<?php _e("Gravity Forms", "gravityforms") ?>" src="<?php echo GFCommon::get_base_url()?>/images/gravity-title-icon-32.png" style="float:left; margin:15px 7px 0 0;"/>
                    <h2><?php _e("Gravity Forms Settings", "gravityforms")?></h2>

                    <table class="form-table">
                      <tr valign="top">
                           <th scope="row"><label for="gforms_key"><?php _e("Support License Key", "gravityforms"); ?></label>  <?php gform_tooltip("settings_license_key") ?></th>
                            <td>
                                <?php
                                $key_field = '<input type="password" name="gforms_key" id="gforms_key" style="width:350px;" value="' . GFCommon::get_key() . '" />';
                                echo apply_filters('gform_settings_key_field', $key_field);
                                ?>
                                <br />
                                <?php _e("The license key is used for access to automatic upgrades and support.", "gravityforms"); ?>
                            </td>
                        </tr>
                       <tr valign="top">
                             <th scope="row"><label for="gforms_disable_css"><?php _e("Output CSS", "gravityforms"); ?></label>  <?php gform_tooltip("settings_output_css") ?></th>
                            <td>
                                <input type="radio" name="gforms_disable_css" value="0" id="gforms_css_output_enabled" <?php echo get_option('rg_gforms_disable_css') == 1 ? "" : "checked='checked'" ?> /> <?php _e("Yes", "gravityforms"); ?>&nbsp;&nbsp;
                                <input type="radio" name="gforms_disable_css" value="1" id="gforms_css_output_disabled" <?php echo get_option('rg_gforms_disable_css') == 1 ? "checked='checked'" : "" ?> /> <?php _e("No", "gravityforms"); ?><br />
                                <?php _e("Set this to No if you would like to disable the plugin from outputting the form CSS.", "gravityforms"); ?>
                            </td>
                        </tr>
                    </table>

                    <div class="hr-divider"></div>

                      <h3><?php _e("reCAPTCHA Settings", "gravityforms"); ?></h3>

                      <p style="text-align: left;"><?php _e("Gravity Forms integrates with reCAPTCHA, a free CAPTCHA service that helps to digitize books while protecting your forms from spam bots. ", "gravityforms"); ?><a href="http://recaptcha.net/" target="_blank"><?php _e("Read more about reCAPTCHA", "gravityforms"); ?></a>.</p>

                      <table class="form-table">


                        <tr valign="top">
                           <th scope="row"><label for="gforms_captcha_public_key"><?php _e("reCAPTCHA Public Key", "gravityforms"); ?></label>  <?php gform_tooltip("settings_recaptcha_public") ?></th>
                            <td>
                                <input type="text" name="gforms_captcha_public_key" style="width:350px;" value="<?php echo get_option("rg_gforms_captcha_public_key") ?>" /><br />
                                <?php _e("Required only if you decide to use the reCAPTCHA field.", "gravityforms"); ?> <?php _e(sprintf("%sSign up%s for a free account to get the key.", '<a target="_blank" href="https://admin.recaptcha.net/recaptcha/createsite/?app=php">', '</a>'), "gravityforms"); ?>
                            </td>
                        </tr>
                        <tr valign="top">
                           <th scope="row"><label for="gforms_captcha_private_key"><?php _e("reCAPTCHA Private Key", "gravityforms"); ?></label>  <?php gform_tooltip("settings_recaptcha_private") ?></th>
                            <td>
                                <input type="text" name="gforms_captcha_private_key" style="width:350px;" value="<?php echo esc_attr(get_option("rg_gforms_captcha_private_key")) ?>" /><br />
                                <?php _e("Required only if you decide to use the reCAPTCHA field.", "gravityforms"); ?> <?php _e(sprintf("%sSign up%s for a free account to get the key.", '<a target="_blank" href="https://admin.recaptcha.net/recaptcha/createsite/?app=php">', '</a>'), "gravityforms"); ?>
                            </td>
                        </tr>

                      </table>

                      <div class="hr-divider"></div>

                      <h3><?php _e("Installation Status", "gravityforms"); ?></h3>
                      <table class="form-table">

                        <tr valign="top">
                           <th scope="row"><label><?php _e("PHP Version", "gravityforms"); ?></label></th>
                            <td class="installation_item_cell">
                                <strong><?php echo phpversion(); ?></strong>
                            </td>
                            <td>
                                <?php
                                    if(version_compare(phpversion(), '5.0.0', '>')){
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/tick.png"/>
                                        <?php
                                    }
                                    else{
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/stop.png"/>
                                        <span class="installation_item_message"><?php _e("Gravity Forms requires PHP 5 or above.", "gravityforms"); ?></span>
                                        <?php
                                    }
                                ?>
                            </td>
                        </tr>
                        <tr valign="top">
                           <th scope="row"><label><?php _e("MySQL Version", "gravityforms"); ?></label></th>
                            <td class="installation_item_cell">
                                <strong><?php echo $wpdb->db_version();?></strong>
                            </td>
                            <td>
                                <?php
                                    if(version_compare($wpdb->db_version(), '5.0.0', '>')){
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/tick.png"/>
                                        <?php
                                    }
                                    else{
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/stop.png"/>
                                        <span class="installation_item_message"><?php _e("Gravity Forms requires MySQL 5 or above.", "gravityforms"); ?></span>
                                        <?php
                                    }
                                ?>
                            </td>
                        </tr>
                        <tr valign="top">
                           <th scope="row"><label><?php _e("WordPress Version", "gravityforms"); ?></label></th>
                            <td class="installation_item_cell">
                                <strong><?php echo get_bloginfo("version"); ?></strong>
                            </td>
                            <td>
                                <?php
                                    if(version_compare(get_bloginfo("version"), '2.8.0', '>')){
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/tick.png"/>
                                        <?php
                                    }
                                    else{
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/stop.png"/>
                                        <span class="installation_item_message"><?php _e("Gravity Forms requires WordPress 2.8 or above.", "gravityforms"); ?></span>
                                        <?php
                                    }
                                ?>
                            </td>
                        </tr>
                         <tr valign="top">
                           <th scope="row"><label><?php _e("Gravity Forms Version", "gravityforms"); ?></label></th>
                            <td class="installation_item_cell">
                                <strong><?php echo GFCommon::$version ?></strong>
                            </td>
                            <td>

                                <?php
                                    $version_info = GFCommon::get_version_info();
                                    if(version_compare(GFCommon::$version, $version_info["version"], '>=')){
                                        ?>
                                        <img src="<?php echo GFCommon::get_base_url() ?>/images/tick.png"/>
                                        <?php
                                    }
                                    else{
                                        GFCommon::check_update();
                                        _e(sprintf("New version %s available. Automatic upgrade available on the %splugins page%s", $version_info["version"], '<a href="plugins.php">', '</a>'), "gravityforms");
                                    }
                                ?>
                            </td>
                        </tr>
                    </table>

                    <?php if(GFCommon::current_user_can_any("gravityforms_edit_settings")){ ?>
                        <br/><br/>
                        <p class="submit" style="text-align: left;">
                        <?php
                        $save_button = '<input type="submit" name="submit" value="' . __("Save Settings", "gravityforms"). '" class="button-primary"/>';
                        echo apply_filters("gform_settings_save_button", $save_button);
                        ?>
                        </p>
                   <?php } ?>
                </form>

                <form action="" method="post">
                    <?php if(GFCommon::current_user_can_any("gravityforms_uninstall")){ ?>
                        <div class="hr-divider"></div>

                        <h3><?php _e("Uninstall Gravity Forms", "gravityforms") ?></h3>
                        <div class="delete-alert"><?php _e("Warning! This operation deletes ALL Gravity Forms data.", "gravityforms") ?>
                            <?php
                            $uninstall_button = '<input type="submit" name="uninstall" value="' . __("Uninstall Gravity Forms", "gravityforms") . '" class="button" onclick="return confirm(\'' . __("Warning! ALL Gravity Forms data will be deleted, including entries. This cannot be undone. \'OK\' to delete, \'Cancel\' to stop", "gravityforms") . '\');"/>';
                            echo apply_filters("gform_uninstall_button", $uninstall_button);
                            ?>

                        </div>
                    <?php } ?>
                </form>
            </div>
        <?php

         if($_POST["submit"]){
             ?>
             <div class="updated fade" style="padding:6px;">
                <?php _e("Settings Updated", "gravityforms"); ?>.
             </div>
             <?php
        }
    }


}
?>