sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterType",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "sap/ui/Device"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller, Filter, FilterOperator, FilterType, JSONModel, MessageToast, Device) {
        "use strict";

        return Controller.extend("zfiorictr1.controller.HomePage", {
            onInit: function() {

                var oRouter = this.getOwnerComponent().getRouter();
                this._oRouterArgs = null;

                oRouter.getRoute("RouteHomePage").attachMatched(this._onRouteMatched, this);

            },
            _onRouteMatched: function(oEvent) {
                // save the current query state
                this._oRouterArgs = oEvent.getParameter("arguments");
                this._oRouterArgs["?query"] = this._oRouterArgs["?query"] || {};

                // search/filter via URL hash
                this._applySearchFilter(this._oRouterArgs["?query"].search);
            },

            onSearchEmployeesTable: function(oEvent) {
                var oRouter = this.getOwnerComponent().getRouter();
                // update the hash with the current search term
                this._oRouterArgs["?query"].search = oEvent.getSource().getValue();
                oRouter.navTo("RouteHomePage", this._oRouterArgs, true /*no history*/ );
            },

            onSearch: function(oEvent) {

                //var aFilters = [];
                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    //  var oFilter = new Filter("Name1", FilterOperator.Contains, sQuery);
                    //  aFilters.push(oFilter);
                }

                // update list binding
                var oList = this.getView().byId("HeaderList");
                var oBinding = oList.getBinding("items");
                //oBinding.filter(aFilters, FilterType.Application);


                oBinding.filter(new Filter([
                    new Filter("Name1", FilterOperator.Contains, sQuery),
                    new Filter("Stceg", FilterOperator.Contains, sQuery),
                    new Filter("Lifnr", FilterOperator.Contains, sQuery)
                ], false));


            },

            onSelectionChange: function(oEvent) {
                var oList = oEvent.getSource();
                var oLabel = this.byId("idFilterLabel");
                var oInfoToolbar = this.byId("idInfoToolbar");

                var aContexts = oList.getSelectedContexts(true);

                // update UI
                var bSelected = (aContexts && aContexts.length > 0);
                var sText = (bSelected) ? aContexts.length + " selected" : null;
                oInfoToolbar.setVisible(bSelected);
                oLabel.setText(sText);
            },
            onListItemPressed: function(oEvent) {
                var oItem, oCtx;
                oItem = oEvent.getSource();
                oCtx = oItem.getBindingContext();
                this.getOwnerComponent().getRouter().navTo("RouteDetailPage", {
                    objectId: oCtx.getProperty("Lifnr")
                });
            }
        });
    });