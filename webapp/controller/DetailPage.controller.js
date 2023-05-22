sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel",
        "../model/formatter"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller, MessageToast, MessageBox, JSONModel, formatter) {
        "use strict";

        var ctrNotSelected, deleteT, ctrBlanc, deleteOK, deleteNOK, supplierNOK;

        const rRegex = /\W/; 

        return Controller.extend("zfiorictr1.controller.DetailPage", {

            formatter: formatter,

            onInit: function() {

                this.getOwnerComponent().getRouter().attachRouteMatched(function(oEvent) {
                    var oData = oEvent.getParameter("arguments");

                });

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteDetailPage").attachMatched(this._onRouteMatched, this);

            },
            _onRouteMatched: function(oEvent) {
                var oArgs, oView;
                oArgs = oEvent.getParameter("arguments");
                oView = this.getView();

                oView.bindElement({
                    path: "/FornecedorSet('" + oArgs.objectId + "')",
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function(oEvent) {
                            oView.setBusy(true);
                        },
                        dataReceived: function(oEvent) {
                            oView.setBusy(false);
                        }
                    }
                });
            },
            _onBindingChange: function(oEvent) {
                // No data for the binding
                if (!this.getView().getBindingContext()) {
                    this.getOwnerComponent().getRouter().getTargets().display("notFound");
                }
            },

            onDelete: function(oEvent) {

                var resourceBundle = this.getView().getModel('i18n').getResourceBundle();

                 ctrNotSelected = resourceBundle.getText('ctrNotSelected');
                 deleteT = resourceBundle.getText('deleteT');
                 deleteOK = resourceBundle.getText('deleteOK');
                 deleteNOK = resourceBundle.getText('deleteNOK');


                try {
                    var ContratoFactoring = this.getView().byId("DetailTable").getSelectedItem().getBindingContext().getProperty("ContratoFactoring");
                } catch (error) {
                    console.log(error);
                    MessageToast.show(ctrNotSelected);
                }

                var that = this;
                if (!ContratoFactoring) {
                    MessageToast.show(ctrNotSelected);
                    return;
                } else {
                    var facNoSpace = ContratoFactoring.replaceAll(' ', '%20'); //remove spaces
                    ContratoFactoring = facNoSpace;
                }

                if (ContratoFactoring) {
                    MessageBox.confirm(deleteT, {
                        onClose: function(sAction) {
                            if (sAction == 'OK') {
                                //Start to remove from Backend
                                that.getOwnerComponent().getModel().remove("/ContratoSet('" + ContratoFactoring + "')", {
                                    method: "DELETE",
                                    success: function(oEnv, Response) {
                                        if (oEnv !== "" || oEnv !== undefined) {
                                            MessageBox.success(deleteOK);
                                        } else {
                                            MessageBox.error(deleteNOK);
                                            MessageBox.error(Response);
                                        }
                                    },
                                    error: function(cc, vv) {

                                        console.log(cc);
                                        MessageBox.error(JSON.parse(cc.responseText).error.message.value);

                                    }
                                });
                            }
                        }
                    });
                }
            },

            onItemPress: function(oEvent) {

                var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
                    ctrBlanc = resourceBundle.getText('ctrBlanc');

                var sContrato = oEvent.getSource().getBindingContext().getProperty("ContratoFactoring");
                if (sContrato) {
                    //Remove Space not treated
                    var sContratoNoSpace = sContrato.replaceAll(' ', '%20');
                    sContrato = sContratoNoSpace;
                    this.getOwnerComponent().getRouter().navTo("RouteEditPage", {
                        objectId: sContrato
                    });
                } else {
                    MessageToast.show(ctrBlanc);
                    return;
                }

            },

            onCreate: function(oEvent) {

                var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
                supplierNOK = resourceBundle.getText('supplierNOK');

                var oItem, oCtx;
                oItem = oEvent.getSource();
                oCtx = oItem.getBindingContext();
                var sLifnr = oCtx.getProperty("Lifnr");
                if (sLifnr) {
                    this.getOwnerComponent().getRouter().navTo("RouteCreatePage", {
                        objectId: oCtx.getProperty("Lifnr")
                    });
                } else {
                    MessageToast.show(supplierNOK);
                    return;
                }
            }
        });
    });