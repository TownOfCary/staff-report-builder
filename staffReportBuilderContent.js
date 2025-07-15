import { LightningElement, track, wire } from 'lwc';
import { subscribe, MessageContext, APPLICATION_SCOPE, publish } from 'lightning/messageService';
import STAFF_REPORT_MESSAGE from '@salesforce/messageChannel/StaffReportMessageChannel__c';

export default class StaffReportBuilderContent extends LightningElement {
    @track report = {}; // Holds the report data
    @track error; // Holds any error messages
    subscription = null; // To manage the subscription

    @wire(MessageContext)
    messageContext;

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

    connectedCallback() {
        // Subscribe to the message channel when the component is initialized
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                STAFF_REPORT_MESSAGE,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    handleMessage(message) {
        console.log('[📨] LMS message received:', message);
        try {
            if (message && typeof message.report === 'object' && message.report !== null && !Array.isArray(message.report)) {
                this.report = { ...message.report };
            } else {
                throw new Error('Invalid message format: Expected message.report to be a non-null object.');
            }
        } catch (error) {
            this.error = error.message;
            console.error('Error processing message:', error);
        }
    }

    handleSectionEdit(event) {
        const field = event.target.name;
        const value = event.target.value;

        console.log(`[✏️] Editing field: ${field}, New value: ${value}`);

        // Update the report field with the new value
        this.report[field] = value;

        // Calculate the number of visible lines based on the character count
        const charCount = value.length;
        const lines = Math.max(3, Math.ceil(charCount / 135));

        // Dynamically set the number of visible lines for the textarea
        const textarea = this.template.querySelector(`textarea[name="${field}"]`);
        if (textarea) {
            textarea.style.height = `${lines * 1.5}em`; // Adjust height (1.5em per line)
        }

        console.log(`[📏] Adjusted height for ${field}: ${lines * 1.5}em`);

        // Publish the updated report
        publish(this.messageContext, STAFF_REPORT_MESSAGE, {
            report: this.report
        });
    }

    get sectionReportLabels() {
        return this.sectionKeys.map((key) => ({
            key,
            label: this.formatLabel(key),
            value: this.report[key] || ''
        }));
    }

    formatLabel(key) {
        // Format section keys into user-friendly labels
        return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    downloadDocx() {
        // Build query string from report fields
        const params = Object.keys(this.report)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(this.report[key] || '')}`)
          .join('&');
        // Open Visualforce page in new tab to trigger Word download
        window.open(`/apex/StaffReportDoc?${params}`, '_blank');
    }

    get isDownloadDisabled() {
        return !this.report || Object.keys(this.report).length === 0;
    }
}