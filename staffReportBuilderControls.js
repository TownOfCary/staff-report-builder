import { LightningElement, track, wire } from 'lwc';
import { publish, subscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import STAFF_REPORT_MESSAGE from '@salesforce/messageChannel/StaffReportMessageChannel__c';
import runOpenAIPrompt from '@salesforce/apex/OpenAIService.runOpenAIPrompt';
import getCatalogRecord from '@salesforce/apex/StaffReportBuilderHelper.getCatalogRecord';
import getCommsPlanRecord from '@salesforce/apex/StaffReportBuilderHelper.getCommsPlanRecord';
import getRezoningSubmittalRecord from '@salesforce/apex/StaffReportBuilderHelper.getRezoningSubmittalRecord';


export default class StaffReportBuilderContent extends LightningElement {
    // Default values make it easy to try the component in a scratch org. Feel
    // free to edit them directly in the UI or tweak them here.
    @track instructions = `
        You are **Staff Report Assistant**, an expert municipal document writer.

        TASK
        - Draft staff-report sections—Title, Purpose, Executive Summary, Recommendation, Background, Discussion, Fiscal Impact, and Next Steps—for the Town of Cary, NC.
        - Write in clear, formal prose that follows AP Style (active voice; concise sentences; no serial comma unless needed for clarity; numerals per AP; etc.).
        - Section length:
        - Title: one concise line (no paragraphs).
        - Purpose & Recommendation: single-sentence (concise).
        - Executive Summary, Background, Discussion, Fiscal Impact, Next Steps: multi-paragraph (minimum two paragraphs each).
        - No bullet lists, fragments, or one-liners except as noted.
        - Where specific facts are unknown, insert ALL-CAPS bracketed placeholders (e.g. [DATE OF INCIDENT], [ORDINANCE NO.], [DEPARTMENT]) that stand alone in their sentence.
        - Tone: objective, professional, and equipping Council with full context.
        - All content must be original, fact-based, and free of hallucinated citations.

        AUDIENCE & PURPOSE
        Town staff use these reports to brief the Cary Town Council before they discuss and vote on agenda items. Reports must therefore:
        1. Provide full background and policy rationale.
        2. Surface fiscal and legal implications.
        3. Clearly articulate the staff recommendation.
        4. Outline actionable next steps upon Council approval.

        OUTPUT RULES
        - Structured mode – Return exactly the JSON schema provided; values are long strings (with embedded line breaks for paragraphs).
        - Unstructured mode – Return a single plain-text section with no header text and no introductory material.
        - Do not add commentary, markdown, or code fences. Only output the report content itself.

        EXAMPLE FORMAT

        json
        {
        "title": "Adopt an Ordinance to Amend Chapter 6, Article II of the Cary Town Code",
        "purpose": "To update the Town Code to align with recent amendments to North Carolina General Statute § [STATUTE NO.].",
        "executive_summary": "The Town has received updated guidance from the State regarding animal control and licensing procedures. State law now requires municipalities to revise local ordinances to mirror changes in definitions and penalty structures.\n\nThe proposed ordinance amends Chapter 6, Article II to incorporate these changes, including updated licensing fees and expanded enforcement authority. Council’s adoption will ensure legal compliance and provide clearer procedures for staff and the public.",
        "recommendation": "That Council adopt the ordinance as presented.",
        "background": "In 2019, the North Carolina General Assembly amended G.S. 160A-186 to redefine “dangerous dog” and adjust hearing procedures. Cary’s current code reflects the 2015 version of state law and no longer aligns with these updates.\n\nPublic Works and Animal Services staff reviewed the state’s changes in March 2025 and drafted an amendment to update definitions, notification requirements, and penalty tiers. Staff presented the draft to the Town Attorney’s Office on [DATE], which recommended minor revisions to due-process language.",
        "discussion": "The revised definitions clarify thresholds for “dangerous” and “potentially dangerous” dogs, adding consistency with state statutes. Staff anticipates that the changes will reduce disputes in enforcement hearings by eliminating ambiguous language.\n\nA comparison of fee structures shows that the new licensing fees—now set at $50 annually for neutered/spayed animals and $100 for unaltered—will align Cary with neighboring jurisdictions. While fees increase modestly, they remain below the regional average, ensuring affordability and cost recovery.",
        "fiscal_impact": "Based on FY 2024 licensing data, Animal Services processed approximately 4,200 licenses annually. The proposed fee changes are projected to increase revenue by $75,000 per fiscal year. These funds will be earmarked for additional field officers and educational outreach.\n\nImplementation costs are minimal, as existing software systems can be reconfigured at no additional license cost. Any public notice requirements will be covered under the current operating budget for Communications and Public Affairs.",
        "next_steps": "Upon ordinance adoption, staff will update the Town Code repository and publish the amendment on the Town website by [DATE]. Animal Services will host an informational webinar for the public on [DATE], accompanied by updated brochures at all customer service centers.\n\nThe Town Clerk’s Office will file the adopted ordinance with the Secretary of State within ten days of adoption. A six-month review of enforcement outcomes will be scheduled for Council’s January 2026 meeting to assess whether additional adjustments are necessary."
        }

        SECTION GUIDANCE
            1.	Title
            •	One line, e.g.
        Adopt an Ordinance to Amend Chapter 6, Article II of the Cary Town Code
            2.	Purpose
            •	Single sentence, e.g.
        To update the Town Code to align with recent amendments to North Carolina General Statute § [STATUTE NO.].
            3.	Executive Summary
            •	Multi-paragraph, e.g.:
        The Town has received updated guidance from the State regarding animal control and licensing procedures. State law now requires municipalities to revise local ordinances to mirror changes in definitions and penalty structures.
        The proposed ordinance amends Chapter 6, Article II to incorporate these changes, including updated licensing fees and expanded enforcement authority. Council’s adoption will ensure legal compliance and provide clearer procedures for staff and the public.
            4.	Recommendation
            •	Single sentence, e.g.
        That Council adopt the ordinance as presented.
            5.	Background
            •	Multi-paragraph, e.g.:
        In 2019, the North Carolina General Assembly amended G.S. 160A‐186 to redefine “dangerous dog” and adjust hearing procedures. Cary’s current code reflects the 2015 version of state law and no longer aligns with these updates.
        Public Works and Animal Services staff reviewed the state’s changes in March 2025 and drafted an amendment to update definitions, notification requirements, and penalty tiers. Staff presented the draft to the Town Attorney’s Office on [DATE], which recommended minor revisions to due-process language.
            6.	Discussion
            •	Multi-paragraph, e.g.:
        The revised definitions clarify thresholds for “dangerous” and “potentially dangerous” dogs, adding consistency with state statutes. Staff anticipates that the changes will reduce disputes in enforcement hearings by eliminating ambiguous language.
        A comparison of fee structures shows that the new licensing fees—now set at $50 annually for neutered/spayed animals and $100 for unaltered—will align Cary with neighboring jurisdictions. While fees increase modestly, they remain below the regional average, ensuring affordability and cost recovery.
            7.	Fiscal Impact
            •	Multi-paragraph, e.g.:
        Based on FY 2024 licensing data, Animal Services processed approximately 4,200 licenses annually. The proposed fee changes are projected to increase revenue by $75,000 per fiscal year. These funds will be earmarked for additional field officers and educational outreach.
        Implementation costs are minimal, as existing software systems can be reconfigured at no additional license cost. Any public notice requirements will be covered under the current operating budget for Communications and Public Affairs.
            8.	Next Steps
            •	Multi-paragraph, e.g.:
        Upon ordinance adoption, staff will update the Town Code repository and publish the amendment on the Town website by [DATE]. Animal Services will host an informational webinar for the public on [DATE], accompanied by updated brochures at all customer service centers.
        The Town Clerk’s Office will file the adopted ordinance with the Secretary of State within ten days of adoption. A six-month review of enforcement outcomes will be scheduled for Council’s January 2026 meeting to assess whether additional adjustments are necessary.
    `;

    @track customPrompt = 'Please write a short staff report on a fictional subject of your choice. Silly is appreciated.';
    sectionKeys = [
        'title',
        'purpose',
        'executive_summary',
        'recommendation',
        'background',
        'discussion',
        'fiscal_impact',
        'next_steps'
    ];

    @track selectedSections = [...this.sectionKeys];
    @track preview = {};
    @track showPreview = false;
    @track report = {}; // Holds the report data
    @track error; // Holds any error messages
    @track isLoading = false;
    // ID of a Salesforce vector store (optional). Replace with your own or
    // leave blank to skip file search.
    @track vectorStoreId = 'vs_680402fb74948191baeb6399973a52ab';
    // Model and temperature used for the OpenAI call
    @track modelName = 'gpt-4.1-mini-2025-04-14';
    @track temperature = 1.2;
    @track selectedCatalogId;
    @track selectedCommsPlanId;
    @track selectedRezoningSubmittalId;

    @track reviewOutput = '';
    @track showReview = false;
    @track reviewInstructions = `
        You are Staff Report Reviewer, a specialized assistant trained to evaluate municipal staff reports for the Town of Cary, NC.

        OBJECTIVE  
        Your job is to provide a comprehensive, constructive critique of a draft staff report written for Town Council review. Focus on clarity, policy alignment, tone, and adherence to professional writing standards.

        CONTEXT  
        You will receive:  
        • A draft staff report, structured in labeled sections (e.g., Purpose, Recommendation, Background).  
        • Optional context from related records (e.g., Catalog, Communications Plan).  
        Do not introduce or reference content outside what is explicitly provided. Never hallucinate facts, assumptions, or report content. Only evaluate and comment on the actual draft text and context messages.

        REVIEW GUIDELINES  
        • Identify issues such as:  
        - Missing or unclear information  
        - Weak or unsupported reasoning  
        - Policy misalignment or ambiguity  
        - Violations of AP Style or inconsistent tone  
        - Opportunities to simplify or professionalize the writing  
        • Be specific in your feedback. When suggesting changes, reference the affected section and propose revised wording or structure where appropriate.  
        • Focus solely on editing and improving the report itself. Do **not** add calls to action, summaries, or next steps for the user.

        OUTPUT RULES    
        • Use only basic inline HTML for formatting: <b>, <i>, <ul>, <li>, <p>, <br>.  
        • Do not include markdown, code blocks, or any other markup.  
        • Use paragraph breaks and lists to make feedback easy to scan in a Salesforce LWC rich text component.

        Your tone should be professional, precise, and helpful. Do not flatter the author or offer generic praise unless it supports a specific improvement. 
    `;

    @track showAdvanced = false;
    @track showSettings = true;

    handleAdvancedToggle(event) {
        this.showAdvanced = event.target.checked;
    }

    handleDismiss() {
        this.showPreview = false;
        this.showSettings = true;
        this.showReview = false;
    }

    catalogDisplayInfo = {
        primaryField: 'Catalog_Name__c',
        additionalFields: ['Name']
    };
    
    commsPlanDisplayInfo = {
        additionalFields: ['Catalog__r.Catalog_Name__c']
    };

    catalogMatchingInfo = {
        primaryField: { fieldPath: 'Catalog_Name__c' },
        additionalFields: [{ fieldPath: 'Name' }],
    };
    commsPlanMatchingInfo = {
        primaryField: { fieldPath: 'Name' },
        additionalFields: [{ fieldPath: 'Catalog__r.Catalog_Name__c' }],
    };

    rezoningSubmittalDisplayInfo = {
        primaryField: 'Name',
        additionalFields: ['txt_REZ_Name__c'],
    };

    rezoningSubmittalMatchingInfo = {
        primaryField: { fieldPath: 'txt_REZ_Name__c' },
    };


    subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                STAFF_REPORT_MESSAGE,
                (message) => this.handleReportMessage(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    handleReportMessage(message) {
        if (message?.report) {
            this.report = { ...message.report };
            console.log('[📥] Report received from Content via LMS:', this.report);
        }
    }

    handleModelChange(event) {
        this.modelName = event.target.value;
    }
    
    handleTemperatureChange(event) {
        this.temperature = parseFloat(event.target.value);
    }

    sectionOptions = this.sectionKeys.map(key => ({
        label: this.formatLabel(key),
        value: key
    }));

    handleInstructionsChange(event) {
        this.instructions = event.target.value;
    }

    handlePromptChange(event) {
        this.customPrompt = event.target.value;
    }

    handleSectionsChange(event) {
        this.selectedSections = event.detail.value;
    }

    handleSelectAll() {
        this.selectedSections = [...this.sectionKeys];
    }

    handleVectorStoreChange(event) {
        this.vectorStoreId = event.target.value;
    }

    handleCatalogSelect(event) {
        this.selectedCatalogId = event.detail.recordId;
    }

    handleCommsPlanSelect(event) {
        this.selectedCommsPlanId = event.detail.recordId;
    }

    handleRezoningSubmittalSelect(event) {
        this.selectedRezoningSubmittalId = event.detail.recordId;
    }


    async handleGenerate() {
        this.error = null;
        this.isLoading = true;
        this.showReview = false;
        this.showSettings = false;
    
        // Prepare context containers
        let current_version = null;
        let catalogRecord = null;
        const contextMessages = [];
        
        try {
            const structured = this.selectedSections && this.selectedSections.length > 0;
            let schema = null;
    
            // 🧠 1. Include current report as assistant message context
            if (Object.keys(this.report).length > 0) {
                current_version = { ...this.report };
    
                const contextText = Object.entries(current_version)
                    .map(([key, value]) => `**${this.formatLabel(key)}**:\n${value}`)
                    .join('\n\n');
    
                contextMessages.push({
                    role: 'assistant',
                    content: `Here is the current version of the staff report:\n\n${contextText}`
                });
            }
    
            // 🧠 2. Include catalog record context (placeholder for now)
            if (this.selectedCatalogId) {
                catalogRecord = await getCatalogRecord({ catalogId: this.selectedCatalogId });
                const catalogText = `Catalog Info:\nName: ${catalogRecord.Catalog_Name__c}\nDescription: ${catalogRecord.Description__c || 'N/A'}\nDepartment: ${catalogRecord.Department__c || 'N/A'}`;
                contextMessages.push({ role: 'assistant', content: catalogText });
            }
            
            if (this.selectedCommsPlanId) {
                const commsPlanRecord = await getCommsPlanRecord({ commsPlanId: this.selectedCommsPlanId });
                const commsText = `Communications Plan Info:\nName: ${commsPlanRecord.Name}\nGeneral Facts: ${commsPlanRecord.General_Facts}\nGoal: ${commsPlanRecord.Goal__c}\nKey Messages: ${commsPlanRecord.Key_Messages__c}\nObjectives: ${commsPlanRecord.Objectives__c}`;
                contextMessages.push({ role: 'assistant', content: commsText });
            }

            if (this.selectedRezoningSubmittalId) {
                const rezoningSubmittalRecord = await getRezoningSubmittal({rezoningSubmittal: this.selectedRezoningSubmittalId });
                const rezoningSubmittalText = `Rezoning Submittal Info:\nName: ${rezoningSubmittalRecord.Name} (${rezoningSubmittalRecord.txt_REZ_Name__c})\nStatus: ${rezoningSubmittalRecord.pick_Status__c}\nProcess Stage: ${rezoningSubmittalRecord.pick_Process_Stage__c}\nAcreage: ${rezoningSubmittalRecord.num_Acreage__c}\nDescription: ${rezoningSubmittalRecord.txta_Summary_Description__c}\nAddress: ${rezoningSubmittalRecord.txta_Property_Address__c}`
                contextMessages.push({ role: 'assistant', content: rezoningSubmittalText });
            }

    
            // 🧠 3. Prepare schema if structured
            if (structured) {
                schema = this.buildSchema(this.selectedSections);
            }
    
            // 🧠 4. Build input message array (system + context + user)
            const messages = [
                { role: 'system', content: this.instructions },
                ...contextMessages,
                { role: 'user', content: this.customPrompt }
            ];

            const contextStrings = contextMessages.map(m => m.content);

            console.log('[🔁 Sending to OpenAI]', {
                instructions: this.instructions,
                prompt: this.customPrompt,
                structured,
                schema,
                context_messages: contextStrings,
                vectorStoreId: this.vectorStoreId
            });
    
            // 🧠 5. Call the OpenAI Apex method
            const aiResponse = await runOpenAIPrompt({
                instructions: this.instructions,
                prompt: this.customPrompt,
                structured: structured,
                schema: schema,
                context_messages: contextStrings,
                vectorStoreId: this.vectorStoreId,
                modelName: this.modelName,
                temperature: this.temperature
            });
    
            console.log('[🧠 AI Response]', aiResponse);
    
            // 🧠 6. Parse response
            if (structured) {
                try {
                    // Attempt to parse the response directly
                    this.preview = JSON.parse(aiResponse);
                } catch (jsonError) {
                    console.error('[❌ JSON Parse Error]', jsonError);
                    console.error('[🧠 Raw AI Response]', aiResponse);

                    // Try to extract a JSON block from the raw response
                    const match = aiResponse.match(/\{[\s\S]*\}/);
                    if (match) {
                        try {
                            this.preview = JSON.parse(match[0]);
                        } catch (innerError) {
                            console.error('[❌ JSON Fallback Parse Error]', innerError);
                            this.error = 'AI returned invalid JSON. See console for raw output.';
                            return;
                        }
                    } else {
                        this.error = 'AI returned invalid JSON. See console for raw output.';
                        return;
                    }
                }
            } else {
                // Unstructured responses are plain text
                const cleaned = aiResponse.trim().replace(/\n{3,}/g, '\n\n');
                const key = this.selectedSections && this.selectedSections.length > 0 ? this.selectedSections[0] : 'response';
                this.preview = {
                    [key]: cleaned
                };
            }

            // Update UI state
            this.isLoading = false;
            this.showPreview = true;
    
        } catch (err) {
            this.error = err.body?.message || err.message;
            console.error('[AI Error]', err);
        }
    }

    handlePreviewEdit(event) {
        const field = event.target.name;
        this.preview[field] = event.target.value;
    }

    handleApply() {
        this.handleDismiss();
        
        // Only apply fields present in the preview to the report
        for (const key in this.preview) {
            if (this.preview.hasOwnProperty(key)) {
                this.report[key] = this.preview[key];
            }
        }
        // For now, console.log what you'd send
        console.log('Applying preview:', this.preview);

        // Future LMS publishing:
        publish(this.messageContext, STAFF_REPORT_MESSAGE, {
            report: this.report  // send the selectively updated report object
        });

        this.showPreview = false;
    }

    handleSectionEdit(event) {
        const field = event.target.name;
        this.report[field] = event.target.value;
    }

    get sectionPreviewLabels() {
        return Object.keys(this.preview).map(key => ({
            key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: this.preview[key]
        }));
    }

    get sectionReportLabels() {
        return this.sectionKeys.map((key) => ({
            key,
            label: this.formatLabel(key)
        }));
    }

    formatLabel(key) {
        // Format section keys into user-friendly labels
        return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    buildSchema(sections) {
        const props = {};
        sections.forEach((key) => {
            props[key] = { type: 'string' };
        });
        return {
            type: 'object',
            additionalProperties: false,
            properties: props,
            required: [...sections]
        };
    }

    parseJsonResponse(raw) {
        // Attempt to extract a JSON object from responses that include extra text
        // such as: {annotations=(), text={...}, type=output_text}
        const textMatch = raw.match(/text=({[^]*})/);
        if (textMatch) {
            return JSON.parse(textMatch[1]);
        }

        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonString = raw.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonString);
        }

        throw new Error('Unable to parse JSON from AI response');
    }

    // handleReview follows the same flow as handleGenerate, but always uses unstructured mode and a review prompt/schema.
    async handleReview() {
        // Reset UI state
        this.error = null;
        this.isLoading = true;
        this.showPreview = false;
        this.showReview = false;
        this.reviewOutput = '';
        this.showSettings = false;

        // Prepare context containers
        let current_version = null;
        let catalogRecord = null;
        const contextMessages = [];

        try {
            // 🧠 1. Include current draft
            if (Object.keys(this.report).length > 0) {
                current_version = { ...this.report };
                const contextText = Object.entries(current_version)
                    .map(([key, value]) => `**${this.formatLabel(key)}**:\n${value}`)
                    .join('\n\n');
                contextMessages.push({
                    role: 'assistant',
                    content: `Here is the current version of the staff report:\n\n${contextText}`
                });
            }

            // 🧠 2. Catalog context
            if (this.selectedCatalogId) {
                catalogRecord = await getCatalogRecord({ catalogId: this.selectedCatalogId });
                const catalogText =
                    `Catalog Info:\nName: ${catalogRecord.Catalog_Name__c}\n` +
                    `Description: ${catalogRecord.Description__c || 'N/A'}\n` +
                    `Department: ${catalogRecord.Department__c || 'N/A'}`;
                contextMessages.push({ role: 'assistant', content: catalogText });
            }

            // 🧠 3. Comms Plan context
            if (this.selectedCommsPlanId) {
                const commsPlanRecord = await getCommsPlanRecord({ commsPlanId: this.selectedCommsPlanId });
                const commsText =
                    `Communications Plan Info:\nName: ${commsPlanRecord.Name}\n` +
                    `General Facts: ${commsPlanRecord.General_Facts}\n` +
                    `Goal: ${commsPlanRecord.Goal__c}\n` +
                    `Key Messages: ${commsPlanRecord.Key_Messages__c}\n` +
                    `Objectives: ${commsPlanRecord.Objectives__c}`;
                contextMessages.push({ role: 'assistant', content: commsText });
            }

            const contextStrings = contextMessages.map(m => m.content);

            console.log('[🔁 Sending REVIEW to OpenAI]', {
                instructions: this.reviewInstructions,
                prompt: 'Please review this staff report and provide detailed feedback.',
                context_messages: contextStrings,
                vectorStoreId: this.vectorStoreId
            });

            // 🧠 4. Call OpenAI (always unstructured for review)
            const aiResponse = await runOpenAIPrompt({
                instructions: this.reviewInstructions,
                prompt: 'Please review this staff report and provide detailed feedback.',
                structured: false,
                schema: null,
                context_messages: contextStrings,
                vectorStoreId: this.vectorStoreId,
                modelName: this.modelName,
                temperature: this.temperature
            });

            console.log(aiResponse)

            // 🧠 5. Parse JSON if present and clean output
            let rawText = aiResponse;

            // If the AI returned JSON with a "response" field, extract it
            try {
                const parsed = JSON.parse(aiResponse);
                if (parsed && typeof parsed.response === 'string') {
                    rawText = parsed.response;
                }
            } catch (e) {
                console.log("Not valid JSON")
                // Not valid JSON, keep rawText as aiResponse
            }

            // If markdown-style formatting is used, convert **bold** and *italic* to HTML
            let cleanedText = rawText
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')   // convert **bold** to <b>bold</b>
                .replace(/\*(.*?)\*/g, '<i>$1</i>')       // convert *italic* to <i>italic</i>
                .replace(/\n/g, '<br>');                  // convert newlines to <br>

            // Convert dash-prefixed lines into <ul><li>...</li></ul> blocks
            cleanedText = cleanedText.replace(/(?:<br>)?- (.*?)(?=(<br>- |\Z))/gs, (match, item) => {
                return `<li>${item.trim()}</li>`;
            });

            // Wrap consecutive <li> items in a <ul>
            cleanedText = cleanedText.replace(/(?:<br>)?<li>[\s\S]*?<\/li>/g, block => {
                const items = block.match(/<li>.*?<\/li>/g);
                return items ? `<ul>${items.join('')}</ul>` : block;
            });

            // Leave existing HTML tags alone so <lightning-formatted-rich-text> renders them

            this.reviewOutput = cleanedText;
            this.showReview = true;
        } catch (err) {
            this.error = err.body?.message || err.message;
            console.error('[AI Review Error]', err);
        } finally {
            this.isLoading = false;
        }
    }
}