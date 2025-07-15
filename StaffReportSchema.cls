public with sharing class StaffReportSchema {
    @AuraEnabled
    public static String getJsonSchema() {
        Map<String, Object> schema = new Map<String, Object>{
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => new Map<String, Object>{
                'title' => new Map<String, Object>{ 'type' => 'string' },
                'purpose' => new Map<String, Object>{ 'type' => 'string' },
                'executive_summary' => new Map<String, Object>{ 'type' => 'string' },
                'recommendation' => new Map<String, Object>{ 'type' => 'string' },
                'background' => new Map<String, Object>{ 'type' => 'string' },
                'discussion' => new Map<String, Object>{ 'type' => 'string' },
                'fiscal_impact' => new Map<String, Object>{ 'type' => 'string' },
                'next_steps' => new Map<String, Object>{ 'type' => 'string' }
            },
            'required' => new List<String>{
                'title', 'purpose', 'executive_summary', 'recommendation',
                'background', 'discussion', 'fiscal_impact', 'next_steps'
            }
        };

        return JSON.serialize(schema);
    }
}