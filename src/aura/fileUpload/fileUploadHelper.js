({
    getMaxFileSize : function(component) {
        // 6 000 000 * 3/4 to account for base64
        var absoluteMax = 4500000; 
        var maxSizeInput = component.get("v.maxFileSize");
        
        return Math.min(absoluteMax, maxSizeInput);
    },
    
    getChunkSize : function(component) {
        return component.get("v.chunkSize");
    },
    
    save : function(component) {
        var file = this.getFile(component);
        
        if (file.size > this.getMaxFileSize(component)) {
            this.showError(component,
            	'File size cannot exceed ' + 
                 this.getMaxFileSize(component) + ' bytes. ' +
                 'Selected file size: ' + file.size);
            return;
        }
        
        var fr = new FileReader();
        
        var self = this;
        fr.onload = function() {
            var fileContents = fr.result;
            var base64Mark = 'base64,';
            var dataStart = fileContents.indexOf(base64Mark) + base64Mark.length;
            
            fileContents = fileContents.substring(dataStart);
            
            self.notifyUploadStarted(component);
            self.upload(component, file, fileContents);
        };
        
        fr.readAsDataURL(file);
    },
    
    upload: function(component, file, fileContents) {
        var fromPos = 0;
        var toPos = Math.min(fileContents.length, fromPos + this.getChunkSize(component));
        
        // start with the initial chunk
        this.uploadChunk(component, file, fileContents, fromPos, toPos, '');   
    },
    
    uploadChunk : function(component, file, fileContents, fromPos, toPos, attachId) {
        var action = component.get("c.saveTheChunk"); 
        var chunk = fileContents.substring(fromPos, toPos);
        
        action.setParams({
            parentId: component.get("v.recordId"),
            fileName: file.name,
            base64Data: encodeURIComponent(chunk), 
            contentType: file.type,
            fileId: attachId
        });
        
        var self = this;
        action.setCallback(this, function(a) {
            if (a.getState() === "SUCCESS") {
                attachId = a.getReturnValue();
                
                fromPos = toPos;
                toPos = Math.min(fileContents.length, fromPos + self.CHUNK_SIZE);
                
                if (fromPos < toPos) {
                    self.uploadChunk(component, file, fileContents, fromPos, toPos, attachId);  
                } else {
                    self.notifyUploadEnded(component, attachId);
                }
            } else if (a.getState() === "ERROR") {
                var errors = action.getError();
                var errorMsg = "Error";
                if (errors)  {
                    $A.log("Errors", errors);
                    if (errors[0] && errors[0].message) {
                        $A.error(errors[0].message);
                        errorMsg = errors[0].message;
                    }
                }
                self.showError(component, errorMsg);
                self.notifyUploadEnded(component, null);
            }
        });
        
        $A.run(function() {
            $A.enqueueAction(action); 
        });
    },
    
    getFile : function(component) {
        var fileComp = component.find("file");
        var file = fileComp.getElement().files[0];
        return file;
    },
    
    notifyUploadStarted : function(component) {
        var evt = component.getEvent("fileUploadStarted");
        evt.fire();
    },
    
    notifyUploadEnded : function(component, attachId) {
        var evt = component.getEvent("fileUploadEnded");
        evt.setParams({
            attachmentId: attachId
        });
        evt.fire();
    },
    
    toggleButton : function(component, text, disabled) {
        var buttonText = component.find("buttonText");
        buttonText.set("v.value", text);
        
        var labelElem = component.find("label").getElement();
        var inputElem = component.find("file").getElement();
        
        if (disabled) {
            labelElem.setAttribute("disabled", disabled);
            inputElem.setAttribute("disabled", disabled);
        } else {
            labelElem.removeAttribute("disabled");
            inputElem.removeAttribute("disabled");
        }
    },
    
    showError : function(component, errorMsg) {
        component.set("v.errorMessage", errorMsg);
    }
})