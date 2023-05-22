sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/UploadCollectionParameter",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/base/util/deepExtend"

], function(Controller, MessageToast, History, Fragment, Filter, FilterOperator, UploadCollectionParameter, formatter, MessageBox, deepExtend) {
    'use strict';

    var contratoNotFound, initialDateNotFound, finalDateNotFound, finalDateCheck, divSupNotFound, supNotFound, noSpecialChar, missingContract, deleteFile;
    var editOK, editNOK, fileLenght, fileSize, deleteOK, deleteNOK;

    var cont = 0; var qtdFile;
    var msgRet = [];
    const rRegex = /\W/;

    return Controller.extend("zfiorictr1.controller.EditPage", {

        formatter: formatter,

        onInit: function(oEvent) {

            var oRoute = this.getOwnerComponent().getRouter();
            var oAttach = oRoute.attachRouteMatched(function(oEvent) {
                return oEvent.getParameter("arguments");
            });

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
                parameters: { expand: "ContratoToEditAnexos" },
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
                oDialog.getBinding("items").filter([new Filter("Lifnr", FilterOperator.Contains, sInputValue)]);
                // Open ValueHelpDialog filtered by the input's value
                oDialog.open(sInputValue);
            });
        },

        onValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");

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

        onChange: function(oEvent) {
            //Security token doesn't work here.
            const oUploadCollection = this.getView().byId("UploadCollection");
            const sPath = this.getView().getBindingContext().getPath();

            const aFileName = [];

            for (var i = 0; i < oUploadCollection.getItems().length; i++) {
                aFileName.push(oUploadCollection.getItems()[i].getProperty("fileName"));
            }

            const aFile = oEvent.getParameters().files;
            var oUpData, oUpItem;

            var messageFile = this.getView().getModel('i18n').getResourceBundle().getText('noSameFile');
            if (!messageFile) {
                messageFile = "O nome do arquivo não pode ser o mesmo ou já existir para este contrato!";
            }

            try {

                aFile.forEach(element => {
                    if (aFileName.some((name) => element.name === name)) {

                        MessageBox.error(messageFile);

                        //oUpData = oUploadCollection.getModel().getData(sPath);
                        oUpData = oUploadCollection.getModel().getData();
                        oUpItem = deepExtend({}, oUpData).items;

                        jQuery.each(oUpItem, function(index) {
                            if (oUpItem[index] && oUpItem[index].fileName === element.name) {
                                oUpItem.splice(index, 1);
                            }
                        });

                        oUploadCollection.getModel().setData({
                            "items": oUpItem
                        });

                    }
                });

            } catch (error) {

                //If the catch occurs the user used the '+' button instead drop a file. 
                for (let i = 0; i < aFile.length; i++) {
                    //console.log(aFile.item(i).name);
                    if (aFileName.some((name) => aFile.item(i).name === name)) {

                        MessageBox.error(messageFile);

                        //oUpData = oUploadCollection.getModel().getData(sPath);
                        oUpData = oUploadCollection.getModel().getData();
                        oUpItem = deepExtend({}, oUpData).items;

                        jQuery.each(oUpItem, function(index) {
                            if (oUpItem[index] && oUpItem[index].fileName === element.name) {
                                oUpItem.splice(index, 1);
                            }
                        });

                        oUploadCollection.getModel().setData({
                            "items": oUpItem
                        });

                    }
                }

            }

        },

        onBeforeUploadStarts: function(oEvent) {

            //var ContratoFactoring = this.getView().byId("HeaderEdit").getTitle();
            var ectrFac = this.getView().byId("HeaderAttribute");
            var ContratoFactoring = "E" + ectrFac.getBindingInfo('text').binding.aValues[1];

            const oUploadCollection = this.getView().byId("UploadCollection");
            if(!cont){
                cont = oUploadCollection.getItems().length + 1; 
            } else {
                cont = cont + 1;
            }

            oEvent.getSource().removeAllHeaderParameters();
            // Header Slug
            var oKey = new UploadCollectionParameter({
                name: "slug",
                value: cont
            });
            oEvent.getParameters().addHeaderParameter(oKey);

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

           // setTimeout(function() {
                //MessageToast.show("Event beforeUploadStarts triggered");
           // }, 4000);

        },

        onSave: function(oEvent) {
            this.getView().setBusy(true);
            var oUploadCollection = this.byId("UploadCollection");
            var cFiles = oUploadCollection.getItems().length;

            var ectrFac = this.getView().byId("HeaderAttribute");
            var ctrFac = "E" + ectrFac.getBindingInfo('text').binding.aValues[1];

            var ctrDesc = this.getView().byId("HeaderEdit").getTitle();
            var fornec = this.getView().byId("HeaderEdit").getNumber();
            var forName = this.getView().byId("HeaderEdit").getIntro();
            var dataIni = this.getView().byId("dataInicio").getDateValue();
            var dataFim = this.getView().byId("dataFim").getDateValue();
            var supplier = this.getView().byId("supplierInput").getValue();
            var suppName = this.getView().byId("supText").getText();

            var oViewBundle = this.getView().getModel("i18n").getResourceBundle();

            contratoNotFound = oViewBundle.getText("contratoNotFound");
            initialDateNotFound = oViewBundle.getText("initialDateNotFound");
            finalDateNotFound = oViewBundle.getText("finalDateNotFound");
            finalDateCheck = oViewBundle.getText("finalDateCheck");
            divSupNotFound = oViewBundle.getText("divSupNotFound");
            supNotFound = oViewBundle.getText("supNotFound");
            missingContract = oViewBundle.getText("missingContract");

            if (!cFiles) {
                MessageToast.show(missingContract);
                this.getView().setBusy(false);
                return;
            }

            if (!ctrFac) {
                MessageToast.show(contratoNotFound);
                this.getView().setBusy(false);
                return;
            }

            if (!ctrDesc) {
                MessageToast.show(contratoNotFound);
                this.getView().setBusy(false);
                return;
            }

            const dataAtual = new Date();
            if (!dataIni) {
                MessageToast.show(initialDateNotFound);
                this.getView().setBusy(false);
                return;
            } else { dataIni.setHours('10'); } //Adjust bug to save the previous day

            if (!dataFim) {
                MessageToast.show(finalDateNotFound);
                this.getView().setBusy(false);
                return;
            } else {
                if (dataFim <= dataIni) {
                    MessageToast.show(finalDateCheck);
                } else { dataFim.setHours('10'); } //Ajust bug to save the previous day 
            }

            if (!supplier) {
                MessageToast.show(divSupNotFound);
                this.getView().setBusy(false);
                return;
            }

            if (!fornec) {
                MessageToast.show(supNotFound);
                this.getView().setBusy(false);
                return;
            }

            var formData = {
                "ContratoFactoring": ctrFac,
                "Description": ctrDesc,
                "Fornecedor": fornec,
                "NomeForne": forName,
                "DataInicio": dataIni,
                "DataFim": dataFim,
                "FornecedorDivergente": supplier,
                "NomeForneD": suppName
            }

            var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
             editOK = resourceBundle.getText('editOK');
             editNOK = resourceBundle.getText('editNOK');

            cont = 0;
            var that = this; 

            //get view to change after edition when there isn't attached file. 
            var oView = this.getView();

            //Save the edited contract 
            this.getOwnerComponent().getModel().create("/ContratoSet", formData, {
                success: function(oEnv) {
                    if (oEnv !== "" || oEnv !== undefined) {
                        if (cFiles > 0) {
                            if (oUploadCollection._aFileUploadersForPendingUpload.length > 0) {
                                oUploadCollection.upload();
                                //oView.setBusy(false);
                            } else if (oUploadCollection._aFilesFromDragAndDropForPendingUpload.length > 0) {
                                oUploadCollection.upload();
                                //oView.setBusy(false);
                            } else {
                                //MessageBox.success("Edited successfully.");
                                //oView.setBusy(false);

                                MessageBox.confirm(editOK, {
                                    actions: [MessageBox.Action.OK],
                                    emphasizedAction: MessageBox.Action.OK,
                                    onClose: function (sAction) {
                                        oView.setBusy(false);
                                        that.onNavBack();
                                    }
                                });
                            }

                        } else {

                            MessageBox.confirm(editOK, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function (sAction) {
                                    oView.setBusy(false);
                                    that.onNavBack();
                                }
                            });
                        }
                    }

                },
                error: function(cc, vv) {

                    console.log(cc);
                    console.log(vv);
                    MessageBox.error(editNOK, {
                        actions: [MessageBox.Action.OK],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (sAction) {
                            oView.setBusy(false);
                            that.onNavBack();
                        }
                    });                    

                }
            });
        },

        onFileDeleted: function(oEvent) {

            var oView = this.getView()

            var document = oEvent.getSource().getProperty("documentId");
            var fileName = oEvent.getSource().getProperty("fileName");

            var fileName2 = oEvent.getSource().getBinding('url').getCurrentValues()[1];
            console.log(fileName2);

            fileName = fileName2;

            var documentNoSpace = document.replaceAll(' ', '%20');
            var fileNameNoSpace = fileName.replaceAll(' ', '%20');

            oView.setBusy(true);

            var that = this;

            //Delete message 
            var oViewBundle = this.getView().getModel("i18n").getResourceBundle();
            deleteFile = oViewBundle.getText("deleteFile");            
            deleteOK = oViewBundle.getText('deleteOK');
            deleteNOK = oViewBundle.getText('deleteNOK');

            MessageBox.confirm(deleteFile, {
                onClose: function(sAction) {

                    if (sAction == 'OK') {
                        //ContratoFactoring='File3',Filename='teste.pdf'
                        that.getOwnerComponent().getModel().remove("/EditAnexoSet(ContratoFactoring='" + documentNoSpace + "',Filename='" + fileNameNoSpace + "')", {
                            method: 'DELETE',
                            success: function(oEnv, oResp) {
                                if (oEnv !== "" || oEnv !== undefined) {
                                    MessageBox.success(deleteOK);
                                } else {
                                    MessageBox.error(deleteNOK);
                                    MessageBox.error(oResp);
                                }
                                that.getView().setBusy(false);
                            },
                            error: function(cc, vv) {
                                MessageBox.error(cc);
                                MessageBox.error(vv);
                                that.getView().setBusy(false);
                            }
                        });
                    } else { that.getView().setBusy(false); }
                }
            });

        },

        onFilenameLengthExceed: function(oEvent) {
            var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
                fileLenght = resourceBundle.getText('fileLenght');

            MessageToast.show(fileLenght); 
        },

        onFileSizeExceed: function(oEvent) {
            var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
            fileSize = resourceBundle.getText('fileSize');
            MessageToast.show(fileSize);
        },

        onUploadComplete: function(oEvent) {

            var resourceBundle = this.getView().getModel('i18n').getResourceBundle();
             editOK = resourceBundle.getText('editOK');

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
            this.getView().setBusy(false);
            
            MessageBox.confirm(editOK, {
                actions: [MessageBox.Action.OK],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    that.onNavBack();
                }
            });
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