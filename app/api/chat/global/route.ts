import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GlobalChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
  referencedRecordings: string[];
  referencedSources: Array<{
    id: string;
    type: 'recording' | 'calendar' | 'action_item';
  name?: string;
    date?: string;
  }>;
  shouldShowSettingsAlert: boolean;
  isEdit: boolean;
}

interface AssistantRole {
  name: string;
  description: string;
  systemPrompt: string;
}

interface RecordingData {
  id: string;
  name: string;
  timestamp: any;
  notes?: string;
  transcript?: string;
  summary?: string;
  actionItems?: string;
  tags?: string[];
  insights?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
}

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  createdAt: Date;
  recordingId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  lastMessageContent: string;
  messageCount: number;
  role: AssistantRole;
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      messages, 
      role, 
      sessionId,
      includeAllMeetings = true, 
      includeCalendar = true, 
      includeActionItems = true 
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.isFromUser !== true) {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const userQuery = lastMessage.content;


    
    // Gather context from various sources
    const context = await gatherContext(userEmail, {
      includeAllMeetings,
      includeCalendar,
      includeActionItems,
      userQuery
    });

    // Build system prompt with role and context
    const systemPrompt = buildSystemPrompt(role, context);

    // Build conversation history for OpenAI
    const conversationHistory = messages.map((msg: GlobalChatMessage) => ({
      role: (msg.isFromUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content
    }));

    // Call OpenAI with optimized settings for faster responses
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // Using the latest fast GPT-4.1 mini model
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "compose_email",
            description: "Compose an email based on meeting content or user requests",
            parameters: {
              type: "object",
              properties: {
                subject: {
                  type: "string",
                  description: "The email subject line"
                },
                body: {
                  type: "string", 
                  description: "The email body content"
                },
                recipients: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "Optional array of recipient email addresses"
                }
              },
              required: ["subject", "body"]
            }
          }
        }
      ],
      tool_choice: "auto", // Let the model decide when to use tools
      temperature: 0.7,
      max_tokens: 1000, // Reduced for faster responses
    });

    let aiResponse = completion.choices[0]?.message?.content || '';
    let toolCalls = completion.choices[0]?.message?.tool_calls;
    
    // console.log('🔍 OpenAI Response Analysis:', {
    //   hasContent: !!aiResponse,
    //   hasToolCalls: !!toolCalls,
    //   toolCallsCount: toolCalls?.length || 0,
    //   toolCallNames: toolCalls?.map(call => call.function.name) || []
    // });
    
    // Handle tool calls
    if (toolCalls && toolCalls.length > 0) {
      const emailTool = toolCalls.find(call => call.function.name === 'compose_email');
      if (emailTool) {
        // console.log('✅ Email tool call found:', {
//           functionName: emailTool.function.name,
//           arguments: emailTool.function.arguments
//         });
        
        try {
          const emailArgs = JSON.parse(emailTool.function.arguments);
          const { subject, body, recipients } = emailArgs;
          
          // console.log('📧 Parsed email arguments:', { subject, body: body?.substring(0, 100) + '...', recipients });
          
          // Create a user-friendly response instead of showing raw tool call
          aiResponse = `I've prepared an email for you with the subject "${subject}". The email composer will open automatically with the drafted content.\n\n*Note: Please ensure popups are allowed in your browser for the email composer to open properly.*`;
          
          // Add the tool call info to the response for the frontend to handle
          aiResponse += `\n\n<!-- EMAIL_TOOL_CALL: ${JSON.stringify({ subject, body, recipients })} -->`;
          
          // console.log('✅ Email tool call processed successfully');
        } catch (error) {
          // console.error('❌ Error parsing email tool call:', error);
          aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
        }
      } else {
        // console.log('⚠️ Tool calls found but no email tool:', toolCalls.map(call => call.function.name));
      }
    } else {
      // console.log('ℹ️ No tool calls in response');
    }
    
    // If no tool calls, use the regular response
    if (!aiResponse) {
      aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    }

    // Determine referenced sources based on the response and query
    const referencedSources = determineReferencedSources(context, userQuery, aiResponse);

    // Create AI message
    const aiMessage: GlobalChatMessage = {
      id: Date.now().toString(),
      content: aiResponse,
      isFromUser: false,
      timestamp: new Date(),
      referencedRecordings: [], // Empty since we're using referencedSources now
      referencedSources,
      shouldShowSettingsAlert: false,
      isEdit: false
    };

    // Save messages to Firebase
    const updatedMessages = [...messages, aiMessage];
    await saveChatSession(userEmail, sessionId, updatedMessages, role);

    const responseData = {
      response: aiResponse,
      referencedRecordings: [], // Empty since we're using referencedSources now
      referencedSources,
      contextUsed: {
        recordingsCount: context.recordings.length,
        calendarEventsCount: context.calendarEvents.length,
        actionItemsCount: context.actionItems.length
      }
    };
    

    
    return NextResponse.json(responseData);

  } catch (error) {
    // console.error('Global chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add new endpoint to handle chat session management
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('sessionId');

    if (action === 'sessions') {
      // Get all chat sessions for user
      const sessions = await getChatSessions(userEmail);
      return NextResponse.json({ sessions });
    }

    if (action === 'messages' && sessionId) {
      // Get messages for specific session
      const messages = await getChatMessages(userEmail, sessionId);
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        
      } catch (error) {
    // console.error('Chat session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle session title updates
export async function PATCH(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const { sessionId, title, action } = await request.json();

    if (action === 'updateTitle' && sessionId && title) {
      await updateSessionTitle(userEmail, sessionId, title);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
        
  } catch (error) {
    // console.error('Chat session PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update session title in Firebase
async function updateSessionTitle(userEmail: string, sessionId: string, title: string) {
  try {
    if (!db) {
      // console.error('❌ Firebase Admin not available');
      return;
    }

    const sessionRef = db.collection('users').doc(userEmail).collection('chatSessions').doc(sessionId);
    
    await sessionRef.update({
      title,
      updatedAt: new Date()
    });

    // console.log(`✅ Updated session title for ${sessionId}: ${title}`);
    
  } catch (error) {
    // console.error('Error updating session title:', error);
    throw error;
  }
}

// Save chat session to Firebase using Admin SDK
async function saveChatSession(
  userEmail: string, 
  sessionId: string, 
  messages: GlobalChatMessage[], 
  role: AssistantRole
) {
  try {
    if (!db) {
      // console.error('❌ Firebase Admin not available');
      return;
    }

    const sessionRef = db.collection('users').doc(userEmail).collection('chatSessions').doc(sessionId);
    
    const lastMessage = messages[messages.length - 1];
    const firstUserMessage = messages.find(m => m.isFromUser);
    
    // Generate title from first user message
    const title = firstUserMessage 
      ? (firstUserMessage.content.length > 50 
          ? firstUserMessage.content.substring(0, 50) + '...' 
          : firstUserMessage.content)
      : 'New Chat';

    // Save session metadata
    await sessionRef.set({
      title,
      lastMessageContent: lastMessage.content,
      messageCount: messages.length,
      role,
      timestamp: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Save messages
    const messagesRef = sessionRef.collection('messages');
    
    // Clear existing messages and save new ones
    const existingMessages = await messagesRef.get();
    
    // Delete existing messages first
    const batch = db.batch();
    existingMessages.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Save all messages
    const messagesBatch = db.batch();
    messages.forEach((message, index) => {
      const messageRef = messagesRef.doc(`msg_${Date.now()}_${index}`);
      messagesBatch.set(messageRef, {
        ...message,
        timestamp: new Date()
      });
    });
    await messagesBatch.commit();

    // console.log(`✅ Saved chat session ${sessionId} with ${messages.length} messages`);
    
  } catch (error) {
    // console.error('Error saving chat session:', error);
    throw error;
  }
}

// Get all chat sessions for a user using Admin SDK
async function getChatSessions(userEmail: string): Promise<ChatSession[]> {
  try {
    if (!db) {
      // console.error('❌ Firebase Admin not available');
      return [];
    }

    const sessionsRef = db.collection('users').doc(userEmail).collection('chatSessions');
    // Limit to 50 most recent sessions to prevent performance issues
    const sessionsSnapshot = await sessionsRef.orderBy('timestamp', 'desc').limit(50).get();
    
    const sessions: ChatSession[] = [];
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        title: data.title || 'Untitled Chat',
        timestamp: data.timestamp?.toDate() || new Date(),
        lastMessageContent: data.lastMessageContent || '',
        messageCount: data.messageCount || 0,
        role: data.role || { name: 'Default', description: '', systemPrompt: '' }
      });
    });
    
    return sessions;
  } catch (error) {
    // console.error('Error fetching chat sessions:', error);
    return [];
  }
}

// Get messages for a specific chat session using Admin SDK
async function getChatMessages(userEmail: string, sessionId: string): Promise<GlobalChatMessage[]> {
  try {
    if (!db) {
      // console.error('❌ Firebase Admin not available');
      return [];
    }

    const messagesRef = db.collection('users').doc(userEmail).collection('chatSessions').doc(sessionId).collection('messages');
    const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();
    
    const messages: GlobalChatMessage[] = [];
    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        content: data.content || '',
        isFromUser: data.isFromUser || false,
        timestamp: data.timestamp?.toDate() || new Date(),
        referencedRecordings: data.referencedRecordings || [],
        referencedSources: data.referencedSources || [],
        shouldShowSettingsAlert: data.shouldShowSettingsAlert || false,
        isEdit: data.isEdit || false
      });
    });
    
    return messages;
  } catch (error) {
    // console.error('Error fetching chat messages:', error);
    return [];
  }
}

async function gatherContext(
  userEmail: string, 
  options: {
    includeAllMeetings: boolean;
    includeCalendar: boolean;
    includeActionItems: boolean;
    userQuery: string;
  }
) {
  const context = {
    recordings: [] as RecordingData[],
    calendarEvents: [] as CalendarEvent[],
    actionItems: [] as ActionItem[]
  };

  try {
    if (!db) {
      return context;
    }

    // Gather recordings/meetings using Admin SDK (optimized)
    if (options.includeAllMeetings) {
      const meetingsRef = db.collection('transcript').doc(userEmail).collection('timestamps');
      // Increased limit to get more recordings for better context
      const meetingsSnapshot = await meetingsRef.orderBy('timestamp', 'desc').limit(50).get();

      // Process recordings directly from the meeting data
      for (const doc of meetingsSnapshot.docs) {
        const meetingData = doc.data();
        const recordingId = doc.id;

        const recording = {
          id: recordingId,
          name: meetingData.name || meetingData.title || `Recording ${recordingId}`,
          timestamp: meetingData.timestamp,
          notes: meetingData.notes || '',
          transcript: meetingData.transcript || '', 
          summary: meetingData.summary || '',
          actionItems: meetingData.actionItems || '',
          insights: meetingData.insights || '',
          tags: meetingData.tags || []
        };

        context.recordings.push(recording);
      }
    }

    // Gather calendar events if requested
    if (options.includeCalendar) {
      try {
        let accessToken = null;
        let refreshToken = null;
        let tokenSource = 'none';
        
        // Check multiple Firebase locations for calendar tokens
        const userDoc = await db.collection('users').doc(userEmail).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          
                      // 1. Check new googleCalendarTokens field (from our callback)
            const newCalendarTokens = userData?.googleCalendarTokens;
            if (newCalendarTokens?.access_token) {
              // Check if tokens are expired
              if (newCalendarTokens?.expiry_date && Date.now() > newCalendarTokens.expiry_date) {
                try {
                  // Remove expired tokens from user document
                  await db.collection('users').doc(userEmail).update({
                    googleCalendarTokens: null,
                    calendarConnected: false
                  });
                } catch (cleanupError) {
                  // Error cleaning up expired tokens
                }
              } else {
                accessToken = newCalendarTokens.access_token;
                refreshToken = newCalendarTokens.refresh_token;
                tokenSource = 'firebase_new';
              }
            }
          
                      // 2. Check legacy googleCalendar field  
            if (!accessToken) {
              const legacyCalendarTokens = userData?.googleCalendar;
              if (legacyCalendarTokens?.accessToken) {
                accessToken = legacyCalendarTokens.accessToken;
                refreshToken = legacyCalendarTokens.refreshToken;
                tokenSource = 'firebase_legacy';
              }
            }
          
                      // 3. Check calendar_tokens collection
            if (!accessToken) {
              const calendarTokenDoc = await db.collection('calendar_tokens').doc(userEmail).get();
              if (calendarTokenDoc.exists) {
                const tokenData = calendarTokenDoc.data();
                accessToken = tokenData?.access_token;
                refreshToken = tokenData?.refresh_token;
                tokenSource = 'firebase_collection';
                
                // Check if tokens are expired based on expiry_date
                if (tokenData?.expiry_date && Date.now() > tokenData.expiry_date) {
                  try {
                    // Remove expired tokens
                    await db.collection('calendar_tokens').doc(userEmail).delete();
                    accessToken = null;
                    refreshToken = null;
                    tokenSource = 'none';
                  } catch (cleanupError) {
                    // Error cleaning up expired tokens
                  }
                }
              }
            }
          
                      // 4. Check nylas_tokens collection (for Nylas calendar integration)
            if (!accessToken) {
              const nylasTokenDoc = await db.collection('nylas_tokens').doc(userEmail).get();
              if (nylasTokenDoc.exists) {
                const tokenData = nylasTokenDoc.data();
                // For Nylas, we need the grantId, not accessToken
                const grantId = tokenData?.grantId;
                if (grantId) {
                  accessToken = grantId; // Use grantId as the identifier for Nylas API
                  refreshToken = tokenData?.refreshToken;
                  tokenSource = 'nylas_tokens';
                  // Note: Don't check expiration here - let the Nylas API endpoints handle token refresh
                }
              }
            }
        }
        
        // 5. FALLBACK: Check cookies if Firebase didn't have tokens
        if (!accessToken) {
          const { cookies } = await import('next/headers');
          const cookieStore = cookies();
          
          accessToken = cookieStore.get('calendar_access_token')?.value;
          refreshToken = cookieStore.get('calendar_refresh_token')?.value;
          
          if (accessToken) {
            tokenSource = 'cookies';
          }
        }
        
        // console.log('🔑 Using calendar tokens from:', tokenSource, 'for chat context');
        
        if (accessToken) {
          let events = [];
          
          // Use Nylas API if we have Nylas tokens (same approach as home page)
          if (tokenSource === 'nylas_tokens' || tokenSource === 'nylas_collection') {
            try {
              // Use the same approach as the home page - call the Nylas calendar API endpoints
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
              
              // First check if calendar is connected
              const statusResponse = await fetch(`${baseUrl}/api/nylas-calendar/status`, {
                headers: {
                  'Authorization': `Bearer ${userEmail}`,
                }
              });
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                const connected = statusData.data?.connected || false;
                
                if (connected) {
                  // Fetch events using the same endpoint as home page
                  const eventsResponse = await fetch(`${baseUrl}/api/nylas-calendar/events?limit=50`, {
                    headers: {
                      'Authorization': `Bearer ${userEmail}`,
                    }
                  });
                  
                  if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    const nylasEvents = eventsData.data || [];
                    
                    // Convert Nylas events to our format (same as home page)
                    context.calendarEvents = nylasEvents.map((event: any) => ({
                      id: event.id || '',
                      title: event.title || event.summary || 'Untitled Event',
                      start: new Date(event.when?.startTime ? event.when.startTime * 1000 : Date.now()),
                      end: new Date(event.when?.endTime ? event.when.endTime * 1000 : Date.now()),
                      description: event.description || '',
                      attendees: event.participants?.map((p: any) => p.email).filter(Boolean) || []
                    }));
                  }
                }
              }
              
            } catch (nylasError) {
              // Don't throw the error, continue without calendar data
            }
          } else {
            // Use Google Calendar API for other token sources
            const { google } = await import('googleapis');
            
            const oauth2Client = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET
            );

            oauth2Client.setCredentials({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            // Try to refresh the token if it's expired
            try {
              await oauth2Client.refreshAccessToken();
            } catch (refreshError) {
              // Token refresh failed, continue with existing token
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // Get events for the next month
            const now = new Date();
            const endOfMonth = new Date();
            endOfMonth.setMonth(now.getMonth() + 1);
            
            try {
              const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: endOfMonth.toISOString(),
                maxResults: 20,
                singleEvents: true,
                orderBy: 'startTime',
              });

              events = response.data.items || [];
            } catch (calendarError) {
              // If it's an invalid_grant error, the tokens are expired/revoked
              if (calendarError instanceof Error && calendarError.message?.includes('invalid_grant')) {
                // Clean up the invalid tokens
                try {
                  if (tokenSource === 'firebase_collection') {
                    await db.collection('calendar_tokens').doc(userEmail).delete();
                  } else if (tokenSource === 'firebase_new') {
                    await db.collection('users').doc(userEmail).update({
                      googleCalendarTokens: null,
                      calendarConnected: false
                    });
                  }
                } catch (cleanupError) {
                  // Error cleaning up invalid tokens
                }
                
                // Don't throw the error, continue without calendar data
              } else {
                // For other errors, still throw to see what's happening
                throw calendarError;
              }
            }
            
            context.calendarEvents = events.map(event => ({
              id: event.id || '',
              title: event.summary || 'Untitled Event',
              start: new Date(event.start?.dateTime || event.start?.date || ''),
              end: new Date(event.end?.dateTime || event.end?.date || ''),
              description: event.description || '',
              attendees: event.attendees?.map(a => a.email).filter(Boolean) || []
            }));
          }
        } else {
          // No calendar tokens found for user
        }
                            } catch (error) {
                // Don't fail the entire context gathering if calendar fails
              }
    }

    // Gather action items from Firebase
    if (options.includeActionItems) {
      try {
        const actionItemsRef = db.collection('transcript').doc(userEmail).collection('actionItems');
        const actionItemsSnapshot = await actionItemsRef.orderBy('meeting.timestamp', 'desc').limit(50).get();
        
        context.actionItems = actionItemsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled Action Item',
            description: data.description || '',
            completed: data.done || false,
            dueDate: data.dueDate?.toDate?.() || undefined,
            createdAt: data.meeting?.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
            recordingId: data.meeting?.id || undefined
          };
        });
      } catch (error) {
        // Error fetching action items
      }
    }
    
  } catch (error) {
    // Error gathering context
  }

  return context;
}

function buildSystemPrompt(role: AssistantRole, context: any): string {
  const basePrompt = role?.systemPrompt || `You are Wisp, an AI assistant that helps users analyze their recordings, emails, and find insights.
  
For email-related queries (anything about emails, sent messages, inbox, etc.), DO NOT look in the recordings/calendar context. Instead, respond with:
"Let me search your emails for that information..." or "Let me check your sent emails..."

The frontend will handle the actual email search using the Nylas API.

For non-email queries, use the following context:`;
  
  let contextPrompt = '\n\n**Available Context:**\n';
  
  if (context.recordings.length > 0) {
    contextPrompt += `\n**Recordings (${context.recordings.length} available):**\n`;
    // Include more recordings for better context
    const relevantRecordings = context.recordings.slice(0, 20);
    
    relevantRecordings.forEach((recording: RecordingData, index: number) => {
      contextPrompt += `\n${index + 1}. ${recording.name}\n`;
      contextPrompt += `   Date: ${new Date(recording.timestamp?.toDate?.() || recording.timestamp).toLocaleDateString()}\n`;
      
      // Include more detailed context
      if (recording.summary) {
        contextPrompt += `   Summary: ${recording.summary.substring(0, 300)}${recording.summary.length > 300 ? '...' : ''}\n`;
      }
      
      if (recording.actionItems) {
        contextPrompt += `   Key Actions: ${recording.actionItems.substring(0, 250)}${recording.actionItems.length > 250 ? '...' : ''}\n`;
      }
      
      if (recording.insights) {
        contextPrompt += `   Insights: ${recording.insights.substring(0, 250)}${recording.insights.length > 250 ? '...' : ''}\n`;
      }
      
      // Include transcript if available
      if (recording.transcript) {
        contextPrompt += `   Transcript: ${recording.transcript.substring(0, 300)}${recording.transcript.length > 300 ? '...' : ''}\n`;
      }
      
      // Include notes if available
      if (recording.notes) {
        contextPrompt += `   Notes: ${recording.notes.substring(0, 250)}${recording.notes.length > 250 ? '...' : ''}\n`;
      }
    });
    
    if (context.recordings.length > 20) {
      contextPrompt += `\n... and ${context.recordings.length - 20} more recordings available.\n`;
    }
  }

  if (context.calendarEvents.length > 0) {
    contextPrompt += `\n**Calendar Events (${context.calendarEvents.length} available):**\n`;
    context.calendarEvents.forEach((event: CalendarEvent, index: number) => {
      const startDate = new Date(event.start).toLocaleDateString();
      const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      contextPrompt += `${index + 1}. ${event.title}\n`;
      contextPrompt += `   Date: ${startDate} at ${startTime} - ${endTime}\n`;
      if (event.description) contextPrompt += `   Description: ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}\n`;
      if (event.attendees && event.attendees.length > 0) {
        contextPrompt += `   Attendees: ${event.attendees.slice(0, 3).join(', ')}${event.attendees.length > 3 ? ` and ${event.attendees.length - 3} more` : ''}\n`;
      }
    });
  } else {
    contextPrompt += `\n**Calendar Events:** No calendar events available. The calendar integration needs to be reconnected. The user should go to Settings > Integrations > Google Calendar to reconnect their calendar.\n`;
  }

  if (context.actionItems.length > 0) {
    contextPrompt += `\n**Action Items (${context.actionItems.length} available):**\n`;
    context.actionItems.forEach((item: ActionItem, index: number) => {
      contextPrompt += `${index + 1}. ${item.title} - ${item.completed ? 'Completed' : 'Pending'}\n`;
      if (item.description) contextPrompt += `   Description: ${item.description}\n`;
      if (item.dueDate) contextPrompt += `   Due: ${item.dueDate}\n`;
    });
  }

  const instructions = `\n\n**Instructions:**
- For ANY email-related queries (sent emails, inbox, drafts, etc.), respond with a searching message
- For non-email queries:
  * Check the context above first before responding
  * When asked about recordings, meetings, or calendar events, search through ALL available context
  * For calendar questions, provide specific details about upcoming meetings
  * For recording questions, search through all recordings and their summaries/transcripts
  * When referencing specific recordings, events, or action items, be specific and mention dates/times
  * If information isn't available in the context, clearly state this limitation
  * Prioritize the most relevant context based on the user's query
  * Cross-reference information across multiple sources when relevant
  * Identify patterns and insights that span multiple recordings or events`;

  return basePrompt + contextPrompt + instructions;
}

function determineReferencedSources(context: any, userQuery: string, aiResponse: string) {
  const referencedSources = [];
  
  // Check which specific recordings were likely referenced
  if (context.recordings.length > 0 && aiResponse.length > 50) {
    // Add individual recordings as sources - show up to 5 most recent
    const recordingsToShow = Math.min(context.recordings.length, 5);
    
    for (let i = 0; i < recordingsToShow; i++) {
      const recording = context.recordings[i];
      referencedSources.push({
        id: recording.id,
        type: 'recording' as const,
        name: recording.name,
        date: recording.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown date'
      });
    }
    
    // If there are more recordings, add a summary entry
    if (context.recordings.length > 5) {
      referencedSources.push({
        id: 'additional_recordings',
        type: 'recording' as const,
        name: `${context.recordings.length - 5} additional recordings`,
        date: 'Various dates'
      });
    }
  }

  // Add calendar sources if calendar events were available and response seems relevant
  if (context.calendarEvents.length > 0 && 
      (userQuery.toLowerCase().includes('schedule') || 
       userQuery.toLowerCase().includes('meeting') ||
       userQuery.toLowerCase().includes('calendar'))) {
    context.calendarEvents.slice(0, 3).forEach(event => {
      referencedSources.push({
        id: event.id,
        type: 'calendar' as const,
        name: event.title,
        date: new Date(event.start).toLocaleDateString()
      });
    });
  }

  // Add action items sources if action items were available and response seems relevant
  if (context.actionItems.length > 0 && 
      (userQuery.toLowerCase().includes('task') || 
       userQuery.toLowerCase().includes('action') ||
       userQuery.toLowerCase().includes('todo'))) {
    context.actionItems.slice(0, 3).forEach(item => {
      referencedSources.push({
        id: item.id,
        type: 'action_item' as const,
        name: item.title,
        date: new Date(item.createdAt).toLocaleDateString()
      });
    });
  }

  return referencedSources;
} 