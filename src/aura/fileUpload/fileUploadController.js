({  
    handleFileUploadStarted : function(component, event, helper) {
        helper.toggleButton(component, "Uploading...", true);
    },
    
    handleFileUploadEnded : function(component, event, helper) {
        helper.toggleButton(component, "Select File", false);
        component.set("v.fileName", "");
    },
    
    handleFileChange : function(component, event, helper) {
        component.set("v.errorMessage", "");
        var file = helper.getFile(component);
        
        if (!$A.util.isUndefined(file)) {
        	component.set("v.fileName", file.name);
        	helper.save(component);
        }
    }
})