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


                try {
                    var ContratoFactoring = this.getView().byId("DetailTable").getSelectedItem().getBindingContext().getProperty("ContratoFactoring");
                } catch (error) {
                    console.log(error);
                    MessageToast.show("Nenhum contrato selecionado");
                }

                var that = this;
                if (!ContratoFactoring) {
                    MessageToast.show("No Contract Selected");
                    return;
                }

                if (ContratoFactoring) {
                    MessageBox.confirm("Toda a informação, incluindo anexos irá ser eliminada. Deseja continuar?", {
                        onClose: function(sAction) {
                            if (sAction == 'OK') {
                                //Start to remove from Backend
                                that.getOwnerComponent().getModel().remove("/ContratoSet('" + ContratoFactoring + "')", {
                                    method: "DELETE",
                                    success: function(oEnv, Response) {
                                        if (oEnv !== "" || oEnv !== undefined) {
                                            MessageBox.success("Deleted successfully.");
                                        } else {
                                            MessageBox.error("Not able to delete. Contract already used");
                                            MessageBox.error(Response);
                                        }
                                    },
                                    error: function(cc, vv) {

                                    }
                                });
                            }
                        }
                    });
                }
            },

            onItemPress: function(oEvent) {

                var sContrato = oEvent.getSource().getBindingContext().getProperty("ContratoFactoring");
                if (sContrato) {
                    this.getOwnerComponent().getRouter().navTo("RouteEditPage", {
                        objectId: sContrato
                    });
                } else {
                    MessageToast.show("Contrato em branco");
                    return;
                }

            },

            onCreate: function(oEvent) {

                var oItem, oCtx;
                oItem = oEvent.getSource();
                oCtx = oItem.getBindingContext();
                var sLifnr = oCtx.getProperty("Lifnr");
                if (sLifnr) {
                    this.getOwnerComponent().getRouter().navTo("RouteCreatePage", {
                        objectId: oCtx.getProperty("Lifnr")
                    });
                } else {
                    MessageToast.show("Um fornecedor deve ser selecionado");
                    return;
                }
            }
        });
    });