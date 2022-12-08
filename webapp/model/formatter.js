sap.ui.define([ "sap/ui/demo/bulletinboard/model/DateFormatter"
], function (DateFormatter) {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        currencyValue : function (sValue) {
            if (!sValue) {
                return "";
            }

            return parseFloat(sValue).toFixed(2);
        },
        date: function(date) {
			return new DateFormatter({source: {pattern: "yyyy/MM/dd"}}).format(date);
		}
    };

}
);
