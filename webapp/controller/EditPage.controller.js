sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/UploadCollectionParameter",
    "sap/m/MessageBox",

], function(Controller, MessageToast, History, Fragment, Filter, FilterOperator, UploadCollectionParameter, MessageBox) {
    'use strict';

    return Controller.extend("zfiorictr1.controller.EditPage", {

        onInit: function(oEvent) {

            var oRoute = this.getOwnerComponent().getRouter();
            var oAttach = oRoute.attachRouteMatched(function(oEvent) {
                return oEvent.getParameter("arguments");
            });

            //Set Attachment Parameter
            //var attachLen = oAttach.getHashChanger().getHash().length;
            //var idAttach = oAttach.getHashChanger().getHash().substring(14, attachLen);
            //var uploadCollection = this.getView().byId("UploadCollection");
            //uploadCollection.setUploadUrl("/sap/opu/odata/sap/ZFIORI_CONTRATO_FOR_DIV_SRV/ContratoSet('" + idAttach + "')/ContratoAnexo");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteEditPage").attachMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function(oEvent) {
            var oArgs, oView;
            oArgs = oEvent.getParameter("arguments");
            oView = this.getView();
            var retId = oArgs.objectId;

            oView.bindElement({
                path: "/ContratoSet('" + oArgs.objectId + "')",
                parameters: { expand: "ContratoAnexo" },
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

            return retId;
        },
        _onBindingChange: function() {
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
                oDialog.getBinding("items").filter([new Filter("Name1", FilterOperator.Contains, sInputValue)]);
                // Open ValueHelpDialog filtered by the input's value
                oDialog.open(sInputValue);
            });
        },

        onValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("Name1", FilterOperator.Contains, sValue);

            oEvent.getSource().getBinding("items").filter([oFilter]);
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

        onChange: function(oEvent) {
            //Security token doesn't work here.
        },

        onBeforeUploadStarts: function(oEvent) {

            var ContratoFactoring = this.getView().byId("HeaderEdit").getTitle();

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

        onSave: function(oEvent) {
            var oUploadCollection = this.byId("UploadCollection");
            var cFiles = oUploadCollection.getItems().length;

            var ctrFac = this.getView().byId("HeaderEdit").getTitle();
            var fornec = this.getView().byId("HeaderEdit").getNumber();
            var forName = this.getView().byId("HeaderEdit").getIntro();
            var dataIni = this.getView().byId("dataInicio").getDateValue();
            var dataFim = this.getView().byId("dataFim").getDateValue();
            var supplier = this.getView().byId("supplierInput").getValue();
            var suppName = this.getView().byId("supText").getText();

            if (!ctrFac) {
                MessageToast.show("Contrato Não Preenchido");
                return;
            }

            const dataAtual = new Date();
            if (!dataIni) {
                MessageToast.show("Data Inicial não Preenchida");
                return;
            }
            /* else {
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

            this.getOwnerComponent().getModel().create("/ContratoSet", formData, {
                success: function(oEnv) {
                    if (oEnv !== "" || oEnv !== undefined) {
                        if (cFiles > 0) {
                            oUploadCollection.upload();
                        } else {
                            MessageBox.success("Created successfully.");
                        }
                    }

                },
                error: function(cc, vv) {

                    MessageBox.error(cc);
                    MessageBox.error(vv);
                    MessageBox.error("New entry not created.");

                }
            });
        },

        onFileDeleted: function(oEvent) {

        },

        onFilenameLengthExceed: function(oEvent) {
            MessageToast.show("Comprimento do arquivo excedido");
        },

        onFileSizeExceed: function(oEvent) {
            MessageToast.show("Tamanho do arquivo excedido");
        },

        onUploadComplete: function(oEvent) {

            this.getView().getModel().refresh();

            var oUploadCollection = oEvent.getSource();
            //Uploaded ID
            var sEventUploaderID = oEvent.getParameters().getParameters().id;

            var oParam = oEvent.getParameter("files")[0];
            //Upload is successful
            if (oParam.status === 201) {
                //this.util.addSuccessMessage(this._oView, "FileName: " + oParam.fileName, "Attachment Uploaded Successfully", "Attachment Uploaded Successfully");
                // Remove the File Uploader instance from upload collection reference
                for (var i = 0; i < oUploadCollection._aFileUploadersForPendingUpload.length; i++) {

                    var sPendingUploadederID = oUploadCollection._aFileUploadersForPendingUpload[i].oFileUpload.id;

                    if (sPendingUploadederID.includes(sEventUploaderID)) {
                        oUploadCollection._aFileUploadersForPendingUpload[i].destroy();
                        oUploadCollection._aFileUploadersForPendingUpload.splice([i], 1);
                    }
                }
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

            this.onNavBack();
        }

    });

});