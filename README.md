# staff-report-builder
A Salesforce-based and AI-powered staff report drafting tool. 

## Classes
- OpenAIService
  - Handles the Responses API callouts to OpenAI using existing OpenAI named credentials
  - Likely will need a switch once moved to Production from Sahara or other test sandbox
- StaffReportBuilderHelper
  - Helps with getting record data from the record picker components
- StaffReportSchema
  - Records the structure(s) of responses acceptable from the AI. Includes functions for assembling dynamic schemas to account for various multi-select section shenanigans. 
## Lightning Web Components
- StaffReportBuilderContent
  - Left side of the page; hosts the 'working draft' that eventually is saved as a word document. 
- StaffReportBuilderControls
  - Right side of the page; hosts the AI prompting interface and the generated content + review results before it is applied to the working draft. 
## Pages
- StaffReportDoc
  - HTML-formatted Word doc for saving the working draft content in a final form. 
## Messaging Channels
- StaffReportMessageChannel
  - Handles the back-and-forth from the Controls and Content LWCs so that a button on one can acquire information from the other. 
