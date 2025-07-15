public with sharing class OpenAIService {

    @AuraEnabled(cacheable=false)
    public static String runOpenAIPrompt(String instructions, String prompt, Boolean structured, Map<String, Object> schema, List<String> context_messages, String vectorStoreId, String modelName, Double temperature) {
        return runOpenAIRequest(instructions, prompt, structured, schema, context_messages, vectorStoreId, modelName, temperature);
    }
    private static String runOpenAIRequest(String assistantInstructions, String userPrompt, Boolean structured, Map<String, Object> schemaJson, List<String> context_messages, String vectorStoreId, String modelName, Double temperature) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:OpenAI_Responses_API/v1/responses');
        request.setMethod('POST');
        request.setTimeout(30000);

        List<Object> inputMessages = new List<Object>();
        List<Object> contextMessages = new List<Object>();
        List<Object> assistantInstructionsList = new List<Object>();
        List<Object> userPrompts = new List<Object>();


        // Add context_messages content to contextMessages list
        if (context_messages != null) {
            for (String contextMessage : context_messages) {
                contextMessages.add(new Map<String, String>{ 'role' => 'system', 'content' => contextMessage});
            }
        }

        // Add assistantInstructions content to assistantInstructions list
        if (assistantInstructions != null) {
            assistantInstructionsList.add(new Map<String, String>{ 'role' => 'system', 'content' => assistantInstructions });
        }

        // Add userPrompts content to userPrompts list
        if (userPrompt != null) {
            userPrompts.add(new Map<String, String>{ 'role' => 'user', 'content' => userPrompt });
        }

        // Combine all messages into the inputMessages list
        if (!contextMessages.isEmpty()) {
            inputMessages.addAll(contextMessages);
        }
        if (!assistantInstructionsList.isEmpty()) {
            inputMessages.addAll(assistantInstructionsList);
        }
        if (!userPrompts.isEmpty()) {
            inputMessages.addAll(userPrompts);
        }


        Map<String, Object> body = new Map<String, Object>{
            'input' => inputMessages
        };

        body.put('model', modelName != null ? modelName : 'gpt-4o');
        body.put('temperature', temperature != null ? temperature : 0.2);
        
        // Only add the "tools" section if a vector store ID was provided
        if (String.isNotEmpty(vectorStoreId)) {
            body.put('tools', new List<Object>{
                new Map<String, Object>{
                    'type' => 'file_search',
                    'vector_store_ids' => new List<String>{ vectorStoreId }
                }
            });
        }

        if (structured && schemaJson != null) {
            body.put('text', new Map<String, Object>{
                'format' => new Map<String, Object>{
                    'type' => 'json_schema',
                    'name' => 'response_schema',
                    'schema' => schemaJson,
                    'strict' => true
                }
            });
        }

        request.setBody(JSON.serialize(body));
        HttpResponse response = http.send(request);

        if (response.getStatusCode() != 200) {
            throw new CalloutException('OpenAI API error: ' + response.getBody());
        }

        Map<String, Object> full = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

        if (!full.containsKey('output')) {
            throw new CalloutException('Missing "output" array in OpenAI response: ' + response.getBody());
        }

        List<Object> outputList = (List<Object>) full.get('output');

        if (outputList.isEmpty()) {
            throw new CalloutException('Empty output array in OpenAI response: ' + response.getBody());
        }

        String output;
        Boolean foundContent = false;

        for (Object o : outputList) {
            Map<String, Object> item = (Map<String, Object>) o;
            if (item.containsKey('content')) {
                Object content = item.get('content');

                // ---- NEW: handle OpenAI's assistant_message format ----
                if (content instanceof Map<String, Object>) {
                    // e.g. {annotations=(), text={...}, type=output_text}
                    Map<String, Object> contentMap = (Map<String, Object>) content;

                    if (contentMap.containsKey('text')) {
                        Object textObj = contentMap.get('text');

                        if (textObj instanceof String) {
                            // When the model already returned a string (could be JSON)
                            output = (String) textObj;
                        } else {
                            // When the model returned a Map/Array – serialise to proper JSON
                            output = JSON.serialize(textObj);
                        }
                    } else {
                        // Fallback – serialise the whole map
                        output = JSON.serialize(contentMap);
                    }
                }
                // ---- existing fall‑backs ----
                else if (content instanceof String) {
                    output = (String) content;
                }
                else if (content instanceof List<Object>) {
                    List<Object> contentList = (List<Object>) content;

                    if (!contentList.isEmpty() && contentList[0] instanceof Map<String, Object>) {
                        // Handle the common single‑element list where the first item
                        // is a map like {annotations=(), text={...}, type=output_text}
                        Map<String, Object> first = (Map<String, Object>) contentList[0];

                        if (first.containsKey('text')) {
                            Object textObj = first.get('text');

                            if (textObj instanceof String) {
                                // The model returned a plain string (could be JSON already).
                                output = (String) textObj;
                            } else {
                                // The model returned a map/array – serialise to proper JSON.
                                output = JSON.serialize(textObj);
                            }
                        } else {
                            // No "text" key – serialise the whole map for inspection.
                            output = JSON.serialize(first);
                        }
                    } else {
                        // Fallback – join everything as a single string, like before.
                        List<String> stringChunks = new List<String>();
                        for (Object chunk : contentList) {
                            stringChunks.add(String.valueOf(chunk));
                        }
                        output = String.join(stringChunks, '\n');
                    }
                } else {
                    throw new CalloutException('Unexpected content format: ' + JSON.serializePretty(content));
                }

                foundContent = true;
                break; // ✅ Found usable output – stop searching
            }
        }

        if (!foundContent) {
            throw new CalloutException('No valid content found in OpenAI output: ' + JSON.serializePretty(outputList));
        }

        // 🌟 Normalise the method’s return to *always* be valid JSON
        String finalOutput;
        if (structured) {
            // Structured replies are already JSON (either directly from the model or serialised above)
            finalOutput = output;
        } else {
            // Unstructured reply – wrap the plain text in a simple JSON object
            Map<String, Object> wrapper = new Map<String, Object>{
                'response' => output
            };
            finalOutput = JSON.serialize(wrapper);
        }

        return finalOutput;
    }
}