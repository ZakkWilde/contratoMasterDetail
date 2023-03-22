sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/routing/History",
        "sap/ui/core/Fragment",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/UploadCollectionParameter",
        "../model/formatter",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller, History, Fragment, Filter, FilterOperator, UploadCollectionParameter, formatter, MessageToast, MessageBox) {
        "use strict";

        var contratoNotFound, initialDateNotFound, finalDateNotFound, finalDateCheck, divSupNotFound, supNotFound, noSpecialChar, missingContract;
        var cont, qtdFile;
        var msgRet = [];
        //const rRegex = /\W/;
        const rRegex = /[ \t]/;

        return Controller.extend("zfiorictr1.controller.CreatePage", {

            formatter: formatter,

            onInit: function() {

                this.getOwnerComponent().getRouter().attachRouteMatched(function(oEvent) {
                    var oData = oEvent.getParameter("arguments");
                });

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteCreatePage").attachMatched(this._onRouteMatched, this);

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

            onValueHelpRequest: function(oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "zfiorictr1.view.ValueHelpDialog",
                        controller: this
                    }).then(function(oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function(oDialog) {
                    // Create a filter for the binding
                    oDialog.getBinding("items").filter([new Filter("Lifnr", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                });
            },

            onValueHelpSearch: function(oEvent) {
                var sValue = oEvent.getParameter("value");
                //var oFilter = new Filter("Name1", FilterOperator.Contains, sValue);

                //oEvent.getSource().getBinding("items").filter([oFilter]);
                var sValueUpper = sValue.toUpperCase();
                oEvent.getSource().getBinding("items").filter(new Filter([
                    //new Filter("Name1", FilterOperator.Contains, sValue),
                    new Filter("Mcod1", FilterOperator.Contains, sValueUpper),
                    new Filter("Stceg", FilterOperator.Contains, sValueUpper),
                    new Filter("Lifnr", FilterOperator.Contains, sValueUpper)
                ], false));
            },

            onValueHelpClose: function(oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this.byId("supplierInput").setValue(oSelectedItem.getDescription());
                this.byId("supText").setText(oSelectedItem.getTitle());
            },

            onBeforeUploadStarts: function(oEvent) {

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

                setTimeout(function() {
                    //MessageToast.show("Event beforeUploadStarts triggered");
                }, 4000);
            },

            onChange: function(oEvent) {
                //Security token doesn't work here.
            },

            onSave: function(oEvent) {
                var oView = this.getView();
                oView.setBusy(true);
                var oUploadCollection = this.byId("UploadCollection");
                var cFiles = oUploadCollection.getItems().length;

                qtdFile = cFiles;
                cont = 0;

                var ctrFac = oView.byId("idContrato").getValue();
                var fornec = oView.byId("HeaderCreate").getNumber();
                var forName = oView.byId("HeaderCreate").getIntro();
                var dataIni = oView.byId("dataInicio").getDateValue();
                var dataFim = oView.byId("dataFim").getDateValue();
                var supplier = oView.byId("supplierInput").getValue();
                var suppName = oView.byId("supText").getText();

                var oViewBundle = oView.getModel("i18n").getResourceBundle();

                contratoNotFound = oViewBundle.getText("contratoNotFound");
                initialDateNotFound = oViewBundle.getText("initialDateNotFound");
                finalDateNotFound = oViewBundle.getText("finalDateNotFound");
                finalDateCheck = oViewBundle.getText("finalDateCheck");
                divSupNotFound = oViewBundle.getText("divSupNotFound");
                supNotFound = oViewBundle.getText("supNotFound");
                noSpecialChar = oViewBundle.getText("noSpecialChar");

                missingContract = oViewBundle.getText("missingContract");

                if (!cFiles) {
                    MessageToast.show(missingContract);
                    oView.setBusy(false);
                    return;
                }

                if (!ctrFac) {
                    MessageBox.alert(contratoNotFound);
                    oView.setBusy(false);
                    return;
                } else {
                    var facNoSpace = ctrFac.replaceAll(/\s/g, '_'); //remove spaces
                    if (rRegex.test(facNoSpace)) {
                        MessageBox.error(noSpecialChar);
                        oView.setBusy(false);
                        return;
                    }
                }

                //const dataAtual = new Date();
                if (!dataIni) {
                    MessageBox.alert(initialDateNotFound);
                    oView.setBusy(false);
                    return;
                }


                if (!dataFim) {
                    MessageBox.alert(finalDateNotFound);
                    oView.setBusy(false);
                    return;
                } else {
                    if (dataFim <= dataIni) {
                        MessageBox.alert(finalDateCheck);
                        oView.setBusy(false);
                        return;
                    }
                }

                if (!supplier) {
                    MessageBox.alert(divSupNotFound);
                    oView.setBusy(false);
                    return;
                }

                if (!fornec) {
                    MessageBox.alert(supNotFound);
                    oView.setBusy(false);
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
                    success: function(oEnv, Response, jqXHR) {
                        if (oEnv !== "" || oEnv !== undefined) {
                            if (cFiles > 0) {
                                oUploadCollection.upload();
                            } else {
                                MessageBox.success("Created successfully.");
                                that.getView().setBusy(false);
                                that.onCanc();
                            }
                        }

                    },
                    error: function(cc, vv) {

                        console.log(cc);
                        console.log(vv);
                        MessageBox.error("New entry not created.");
                        that.getView().setBusy(false);

                    }
                });
            },

            onUploadComplete: function(oEvent) {
                this.getView().getModel().refresh();

                this.getView().byId("idContrato").setValue("");
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

                const sStatus = oEvent.getParameter('files')[0].status;
                //const sName = oEvent.getParameter('files')[0].name;

                cont = cont + 1;
                msgRet.push(sStatus);

                var that = this;

                if (cont === qtdFile) {

                    if (msgRet.some((element) => element >= 200 && element <= 300)) {
                        MessageToast.show("Create Successfuly");
                        that.resetUpload();
                    } else {
                        MessageBox.error("Record not created, contact support.");
                        that.resetUpload();
                    };
                }

            },

            onNavBack: function() {
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteDetailPage", {}, true);
                }
            },

            onCanc: function() {

                //clear screen parameters
                this.getView().byId("idContrato").setValue("");
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

            },

            resetUpload: function() {

                var oView = this.getView();

                oView.byId("idContrato").setValue("");
                oView.byId("dataInicio").setValue("");
                oView.byId("dataFim").setValue("");
                oView.byId("supplierInput").setValue("");

                try {
                    var UploadCanc = oView.byId("UploadCollection");

                    for (var i = 0; i < UploadCanc._aFileUploadersForPendingUpload.length; i++) {

                        UploadCanc._aFileUploadersForPendingUpload[i].destroy();
                        UploadCanc._aFileUploadersForPendingUpload.splice([i], 1);

                    }

                    UploadCanc.destroyHeaderParameters();
                    UploadCanc.destroyItems();
                } catch (oError) {
                    console.log(oError);
                }

                this.getView().setBusy(false);

            }

        });
    }
)