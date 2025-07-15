public with sharing class StaffReportDocController {
    public String reportTitle   { get; set; }
    public String reportPurpose { get; set; }
    public String reportExecutiveSummary { get; set; }
    public String reportRecommendation { get; set; }
    public String reportBackground { get; set; }
    public String reportDiscussion { get; set; }
    public String reportFiscalImpact { get; set; }
    public String reportNextSteps { get; set; }
    // add matching props for each field you pass

    public StaffReportDocController() {
        // pull URL params into your props
        reportTitle   = ApexPages.currentPage().getParameters().get('title');
        reportPurpose = ApexPages.currentPage().getParameters().get('purpose');
        reportExecutiveSummary = ApexPages.currentPage().getParameters().get('executive_summary');
        reportRecommendation = ApexPages.currentPage().getParameters().get('recommendation');
        reportBackground = ApexPages.currentPage().getParameters().get('background');
        reportDiscussion = ApexPages.currentPage().getParameters().get('discussion');
        reportFiscalImpact = ApexPages.currentPage().getParameters().get('fiscal_impact');
        reportNextSteps = ApexPages.currentPage().getParameters().get('next_steps');
    }

    // new helper to build absolute URLs
    public String getBaseUrl() {
        // e.g. “https://yourDomain.my.salesforce.com”
        return URL.getOrgDomainUrl().toExternalForm();
    }

    /**
     * Returns a data URI for the given static resource image.
     * Example: data:image/png;base64,iVBORw0KG...
     */
    public String getBase64Image(String resourceName, String mimeType) {
        // Query the static resource by name
        StaticResource sr = [
            SELECT Body
            FROM StaticResource
            WHERE Name = :resourceName
            LIMIT 1
        ];
        // Base64-encode the blob
        String encoded = EncodingUtil.base64Encode(sr.Body);
        // Return as data URI
        return 'data:' + mimeType + ';base64,' + encoded;
    }

    public String getTownSealBase64() {
        return getBase64Image('TownSeal', 'image/jpeg');
    }
}