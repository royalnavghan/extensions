/**
 * Text Analyzer Extension with OCR - Prompt Utilities
 * Author: Santhosh Kumar Reddy
 */

function getTextAnalysisPrompt(text) {
  return `You are analyzing text extracted from a screenshot using OCR.

INSTRUCTIONS:

1. If the text contains a multiple-choice question (MCQ):
   - On the FIRST LINE, show ONLY the correct answer in this format: "X. [Option text]" (where X is A, B, C, or D)
   - Then add an "**Explanation:**" section with a detailed explanation of why this answer is correct
   - Use Markdown formatting (bold, bullet points, etc.) to make your answer clear and structured
   - Include a section for "**Why Option X is Correct:**" and sections for "**Why Option Y is Incorrect:**" for each wrong option
   - Be direct and confident in your answer selection
   - End with a "**Relevant Concepts and Principles:**" section summarizing key concepts

2. If the text is not an MCQ but contains a question:
   - Answer the question directly and concisely at the beginning
   - Format your answer using Markdown with headers, subheaders, and bullet points
   - Provide supporting explanations after your answer
   - Break complex information into structured sections with clear headers

3. If the text contains information without a specific question:
   - Begin with a clear summary of the key points
   - Use bullet points and hierarchical structure to organize information
   - Use bold text for important concepts
   - Create a logical structure with headings and subheadings

4. If the text contains code:
   - Explain what the code does clearly and concisely
   - Identify any issues or optimizations
   - Use code blocks with proper formatting
   - Organize your explanation with headers and bullet points

FORMAT YOUR RESPONSE USING MARKDOWN:
- Use **bold** for important points and headings
- Use bullet points (*, -) and nested bullet points for lists
- Use headers (# Main Header, ## Subheader) for sections
- Format code with backticks (inline \`code\`) or code blocks (\`\`\`code\`\`\`)
- For MCQs, make the answer and explanation headers stand out

Here is the extracted text:
${text}`;
} 
