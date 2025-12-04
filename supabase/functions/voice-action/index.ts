
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "npm:@google/genai";

declare const Deno: any;

serve(async (req) => {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    const speechResult = formData.get('SpeechResult') as string;

    console.log(`Voice Input from ${from}: ${speechResult}`);

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Identify Integration
    let { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('phone_number', to)
      .maybeSingle();

    if (!integration) {
        const toNoPlus = to.replace(/^\+/, '');
        const { data: retryData } = await supabaseAdmin.from('integrations').select('*').eq('phone_number', toNoPlus).maybeSingle();
        if (retryData) integration = retryData;
    }

    if (!integration) return new Response('', { status: 200 });

    const voiceId = integration.voice_id || "Polly.Joanna";
    const callbackUrl = `${(Deno as any).env.get('SUPABASE_URL')}/functions/v1/voice-action`;

    // 3. Find/Create Conversation
    let conversationId = null;
    const cleanFrom = from.replace(/\D/g, '').slice(-10);

    const { data: recentConvs } = await supabaseAdmin
      .from('conversations')
      .select('id, phone')
      .eq('user_id', integration.user_id)
      .order('last_message_at', { ascending: false })
      .limit(50);
    
    if (recentConvs) {
      const match = recentConvs.find((c: any) => (c.phone || '').replace(/\D/g, '').slice(-10) === cleanFrom);
      if (match) conversationId = match.id;
    }

    if (!conversationId) {
        const { data: newConv } = await supabaseAdmin.from('conversations').insert({
            user_id: integration.user_id,
            phone: from,
            client_name: 'Voice Caller',
            channel: 'voice',
            status: 'new',
            last_message: '[Voice Call Started]'
        }).select().single();
        conversationId = newConv.id;
    }

    // 4. Save User Speech (Fire and forget)
    if (speechResult) {
        supabaseAdmin.from('messages').insert({
            conversation_id: conversationId,
            sender: 'user',
            text: `[Voice] ${speechResult}`
        }); 
    }

    // 5. Generate AI Response
    let aiResponseText = "I'm sorry, I didn't catch that.";

    if (speechResult && integration.ai_api_key) {
        try {
            const ai = new GoogleGenAI({ apiKey: integration.ai_api_key });
            const modelId = 'gemini-2.5-flash';
            
            // Get Past History (excluding current speech to avoid race condition)
            const { data: messages } = await supabaseAdmin
                .from('messages')
                .select('sender, text')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(5);
            
            // Construct History
            const history = (messages || []).reverse().map((m: any) => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text.replace('[Voice] ', '') }]
            }));

            // STATELESS FIX: Manually append the current speech to the history
            // This ensures the AI hears the user even if the DB write above hasn't finished.
            history.push({ role: 'user', parts: [{ text: speechResult }] });

            const baseTraining = integration.ai_context 
                ? integration.ai_context 
                : `You are a helpful AI receptionist. Your goal is: ${integration.business_goal || 'Help the client'}.`;

            const systemInstruction = `${baseTraining}

IMPORTANT VOICE INSTRUCTIONS:
1. You are speaking on the phone.
2. Keep responses SHORT and CONVERSATIONAL (1-2 sentences max).
3. Do not use emojis, markdown, or bullet points.
4. If you need to list things, say "First, ... Second, ...".
5. Be polite but direct.`;

            const result = await ai.models.generateContent({
                model: modelId,
                contents: history,
                config: { 
                    systemInstruction, 
                    maxOutputTokens: 150,
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                    ]
                }
            });
            
            if (result.text) {
                aiResponseText = result.text;
            }
        } catch (e) {
            console.error("AI Gen Error in Voice:", e);
        }
        
        // Save AI response
        await supabaseAdmin.from('messages').insert({
            conversation_id: conversationId,
            sender: 'ai',
            text: `[Voice] ${aiResponseText}`
        });
    }

    // 6. Return TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="${voiceId}">${aiResponseText}</Say>
        <Gather input="speech" action="${callbackUrl}" method="POST" speechTimeout="auto" language="en-US">
            <Pause length="10" />
        </Gather>
        <Say voice="${voiceId}">Goodbye.</Say>
    </Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error: any) {
    console.error("Voice Action Error:", error.message);
    // Fallback TwiML to allow the call to end gracefully
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response><Say>Sorry, I had an error.</Say></Response>`,
        { headers: { "Content-Type": "text/xml" } }
    );
  }
});
