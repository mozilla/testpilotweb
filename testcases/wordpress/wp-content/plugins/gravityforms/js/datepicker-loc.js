jQuery(document).ready(
    function() {
        jQuery('.datepicker').datepicker('option', jQuery.extend({showMonthAfterYear: true}, jQuery.datepicker.regional['fr']));
    }
);

