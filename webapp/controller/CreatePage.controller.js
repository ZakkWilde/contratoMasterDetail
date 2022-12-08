sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/UploadCollectionParameter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, History, Fragment, Filter, FilterOperator, UploadCollectionParameter, MessageToast, MessageBox) {
        "use strict";

        return Controller.extend("zfiorictr1.controller.CreatePage", {

            onInit: function () {

                this.getOwnerComponent().getRouter().attachRouteMatched(function (oEvent) {
                    var oData = oEvent.getParameter("arguments");
                });

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteCreatePage").attachMatched(this._onRouteMatched, this);

            },
            _onRouteMatched: function (oEvent) {
                var oArgs, oView;
                oArgs = oEvent.getParameter("arguments");
                oView = this.getView();

                oView.bindElement({
                    path: "/FornecedorSet('" + oArgs.objectId + "')",
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function (oEvent) {
                            oView.setBusy(true);
                        },
                        dataReceived: function (oEvent) {
                            oView.setBusy(false);
                        }
                    }
                });
            },
            _onBindingChange: function (oEvent) {
                // No data for the binding
                if (!this.getView().getBindingContext()) {
                    this.getOwnerComponent().getRouter().getTargets().display("notFound");
                }
            },

            onValueHelpRequest: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "zfiorictr1.view.ValueHelpDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oDialog) {
                    // Create a filter for the binding
                    oDialog.getBinding("items").filter([new Filter("Name1", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                });
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("Name1", FilterOperator.Contains, sValue);

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this.byId("supplierInput").setValue(oSelectedItem.getDescription());
                this.byId("supText").setText(oSelectedItem.getTitle());
            },

            onBeforeUploadStarts: function (oEvent) {

                var ContratoFactoring = this.getView().byId("idContrato").getValue();

                oEvent.getSource().removeAllHeaderParameters();
                // Header Slug
                var oCustomerHeaderSlug = new UploadCollectionParameter({
                    name: "slug",
                    value: encodeURIComponent(oEvent.getParameter("fileName"))
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

                var oKey = new UploadCollectionParameter({
                    name: "slug",
                    value: ContratoFactoring
                });
                oEvent.getParameters().addHeaderParameter(oKey);

                var oModel = this.getView().getModel();
                oModel.refreshSecurityToken();

                var oToken = new UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: oModel.getSecurityToken()
                });
                oEvent.getParameters().addHeaderParameter(oToken);

                setTimeout(function () {
                    //MessageToast.show("Event beforeUploadStarts triggered");
                }, 4000);
            },

            onChange: function (oEvent) {
                //Security token doesn't work here.
            },

            onSave: function (oEvent) {
                this.getView().setBusy(true);
                var oUploadCollection = this.byId("UploadCollection");
                var cFiles = oUploadCollection.getItems().length;

                var ctrFac = this.getView().byId("idContrato").getValue();
                var fornec = this.getView().byId("HeaderCreate").getNumber();
                var forName = this.getView().byId("HeaderCreate").getIntro();
                var dataIni = this.getView().byId("dataInicio").getDateValue();
                var dataFim = this.getView().byId("dataFim").getDateValue();
                var supplier = this.getView().byId("supplierInput").getValue();
                var suppName = this.getView().byId("supText").getText();

                if (!ctrFac) {
                    MessageToast.show("Contrato Não Preenchido");
                    return;
                }

                //const dataAtual = new Date();
                if (!dataIni) {
                    MessageToast.show("Data Inicial não Preenchida");
                    return;
                } /* else {
                    if (dataIni < dataAtual) {
                        MessageToast.show("Data Inicial deve ser maior que a data atual")
                    }
                } */


                if (!dataFim) {
                    MessageToast.show("Data Final não preenchida");
                    return;
                } else {
                    if (dataFim <= dataIni) {
                        MessageToast.show("Data final deve ser maior que a data Inicial");
                    }
                }

                if (!supplier) {
                    MessageToast.show("Fornecedor Divergente não preenchido");
                    return;
                }

                if (!fornec) {
                    MessageToast.show("Fornecedor não preenchido");
                    return;
                }

                var formData = {
                    "ContratoFactoring": ctrFac,
                    "Fornecedor": fornec,
                    "NomeForne": forName,
                    "DataInicio": dataIni,
                    "DataFim": dataFim,
                    "FornecedorDivergente": supplier,
                    "NomeForneD": suppName
                }

                var that = this; 

                this.getOwnerComponent().getModel().create("/ContratoSet", formData, {
                    success: function (oEnv, Response, jqXHR) {
                        if (oEnv !== "" || oEnv !== undefined) {
                            if (cFiles > 0) {
                                oUploadCollection.upload();
                            } else {
                                MessageBox.success("Created successfully.");
                                that.getView().setBusy(false);
                            }
                        }

                    },
                    error: function (cc, vv) {

                        MessageBox.error(cc);
                        MessageBox.error(vv);
                        MessageBox.error("New entry not created.");
                        that.getView().setBusy(false);

                    }
                });
            },

            onUploadComplete: function (oEvent) {
                this.getView().getModel().refresh();

                this.getView().byId("idContrato").setValue("");
                this.getView().byId("HeaderCreate").setNumber("");
                this.getView().byId("dataInicio").setValue("");
                this.getView().byId("dataFim").setValue("");
                this.getView().byId("supplierInput").setValue("");

                var oUploadCollection = oEvent.getSource();
                var sEventUploaderID = oEvent.getParameters().getParameters().id;

                for (var i = 0; i < oUploadCollection._aFileUploadersForPendingUpload.length; i++) {

                    var sPendingUploadederID = oUploadCollection._aFileUploadersForPendingUpload[i].oFileUpload.id;

                    if (sPendingUploadederID.includes(sEventUploaderID)) {
                        oUploadCollection._aFileUploadersForPendingUpload[i].destroy();
                        oUploadCollection._aFileUploadersForPendingUpload.splice([i], 1);
                    }
                }

                this.getView().setBusy(false);

            },

            onNavBack: function () {
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteDetailPage", {}, true);
                }
            },

            onCanc: function () {

                this.getView().byId("idContrato").setValue("");
                this.getView().byId("HeaderCreate").setNumber("");
                this.getView().byId("dataInicio").setValue("");
                this.getView().byId("dataFim").setValue("");
                this.getView().byId("supplierInput").setValue("");

                try {
                    var UploadCanc = this.getView().byId("UploadCollection");

                    for (var i = 0; i < UploadCanc._aFileUploadersForPendingUpload.length; i++) {

                        UploadCanc._aFileUploadersForPendingUpload[i].destroy();
                        UploadCanc._aFileUploadersForPendingUpload.splice([i], 1);

                    }

                    UploadCanc.destroyHeaderParameters();
                    UploadCanc.destroyItems();
                } catch (oError) {
                    console.log(oError);
                }

                var oHash = History.getInstance().getPreviousHash();
                if (oHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.getOwnerComponent().getRouter().navTo("RouteDetailPage", {}, true);
                }

            }

        });
    }
)