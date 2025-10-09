import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context, canEdit } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Prepare system message based on editing capability
    const systemMessage = canEdit
      ? `You are a helpful AI assistant that helps users analyze and edit meeting notes and transcripts.
         You can suggest edits to the notes ONLY when the user explicitly asks to edit, modify, or change the notes.
         
         **Edit Detection Rules:**
         Only treat as edit requests when the user explicitly uses phrases like:
         - "Edit the notes to..."
         - "Modify the notes to..."
         - "Change the notes to..."
         - "Update the notes with..."
         - "Rewrite the notes to..."
         - "Add to the notes..."
         
         **NOT Edit Requests (treat as analysis questions):**
         - "Summarize this meeting"
         - "What were the action items?"
         - "What was discussed?"
         - "Can you format this better?" (unless they say "format the notes")
         - "What are the key points?"
         - "Who attended the meeting?"
         - Any question asking for information or analysis
         
         IMPORTANT: Never completely replace the original notes. Always preserve the original content and only add to it or make specific edits while keeping the original structure and information intact.
         
         When you detect a genuine edit request:
         1. Understand what changes they want to make
         2. Make the requested changes to the notes while preserving ALL of the original content and structure
         3. For formatting, use proper Markdown syntax with headings (##, ###), bullet points, bold text, etc.
         4. If summarizing, maintain ALL the original points and only add a summary section
         5. When adding content, clearly indicate what is being added without removing anything
         6. When editing, make minimal changes necessary to fulfill the request while keeping everything else intact
         7. Return your response in this format:
            EDIT_SUGGESTION: true
            EDIT_PREVIEW: [First show the complete edited version of the notes]
            MESSAGE: Here's how I've modified the notes:
            [List the specific changes made]
            
            Would you like me to apply these changes?

         Current content:
         ${context || 'No content provided'}`
      : `You are a helpful AI assistant that helps users analyze meeting notes and transcripts. 
         Use the following meeting content as context for your responses:
         
         ${context || 'No content provided'}`;

    // Add a message to help detect edit intents - but be much more conservative
    const apiMessages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'system',
        content: `Only treat the user's message as an edit request if they explicitly ask to edit, modify, change, or update the actual notes content. Questions asking for analysis, summaries, or information should be answered normally without suggesting edits. Be conservative - when in doubt, treat it as an analysis question, not an edit request.`
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = response.choices[0].message.content;
    
    // Check if this is an edit suggestion
    if (canEdit && assistantMessage?.includes('EDIT_SUGGESTION: true')) {
      const parts = assistantMessage.split('\n');
      const editPreviewIndex = parts.findIndex(p => p.startsWith('EDIT_PREVIEW:'));
      const messageIndex = parts.findIndex(p => p.startsWith('MESSAGE:'));
      
      if (editPreviewIndex !== -1 && messageIndex !== -1) {
        const editedNotes = parts
          .slice(editPreviewIndex + 1, messageIndex)
          .join('\n')
          .trim();
        const message = parts
          .slice(messageIndex + 1)
          .join('\n')
          .trim();
        
        return NextResponse.json({
          response: message,
          editedNotes: editedNotes,
          isEditSuggestion: true
        });
      }
    }

    return NextResponse.json({
      response: assistantMessage,
      isEditSuggestion: false
    });
  } catch (error) {
    // console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 