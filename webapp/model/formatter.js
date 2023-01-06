sap.ui.define(["sap/ui/model/odata/type/Time"], function(Time) {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        currencyValue: function(sValue) {
            if (!sValue) {
                return "";
            }

            return parseFloat(sValue).toFixed(2);
        },

        formatUrl: function(sCtr, sFName) {
            //Example: Anexos(ContratoFactoring='File3',Filename='teste2.pdf')/$value
            let sUrl = this.getView().getModel().sServiceUrl;
            sUrl += "/" + "EditAnexoSet(ContratoFactoring='" + sCtr + "',Filename='" + sFName + "')" + "/$value";
            return sUrl;
        },

        formatTime: function(oTime) {

            var sTime = new Time(oTime).formatValue({
                __edmType: "Edm.Time",
                ms: 86398000
            }, "string");

            return sTime;

        },

        addSpace: function(sValue) {
            if (sValue) {
                var sSpace = sValue.replaceAll('_', ' ');
                return sSpace;
            }
        }
    };

});