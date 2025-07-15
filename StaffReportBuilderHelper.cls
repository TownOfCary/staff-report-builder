public with sharing class StaffReportBuilderHelper {
    @AuraEnabled(cacheable=true)
    public static Catalog__c getCatalogRecord(Id catalogId) {
        return [SELECT Name, Catalog_Name__c, Description__c, Department_Name__c FROM Catalog__c WHERE Id = :catalogId LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static Comms_Planning__c getCommsPlanRecord(Id commsPlanId) {
        return [SELECT Name, Catalog__r.Catalog_Name__c, General_Facts__c, Goal__c, Key_Messages__c, Objectives__c FROM Comms_Planning__c WHERE Id = :commsPlanId LIMIT 1];
    }

    @AuraEnabled(cacheable=true)
    public static rezoning_submittal__c getRezoningSubmittalRecord(Id rezoningSubmittalId) {
        return [SELECT txt_REZ_Name__c, Name, pick_Status__c, pick_Process_Stage__c, num_Acreage__c, txta_Summary_Description__c, txta_Property_Address__c FROM rezoning_submittal__c WHERE Id = :rezoningSubmittalId LIMIT 1];
    }
}