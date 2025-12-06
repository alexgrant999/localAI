

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 2. Handle Verification Challenge (Meta Setup)
  if (req.method === 'GET') {
     const mode = url.searchParams.get('hub.mode');
     const token = url.searchParams.get('hub.verify_token');
     const challenge = url.searchParams.get('hub.challenge');
     
     console.log(`Verifying Webhook: Mode=${mode}, Token=${token}`);
     
     if (mode === 'subscribe' && token === 'localai') {
       return new Response(challenge, { status: 200 });
     }
     return new Response('Forbidden', { status: 403 });
  }

  try {
    if (!req.body) return new Response("Missing body", { status: 400, headers: corsHeaders });
    
    // 3. Parse and Log Body
    const body = await req.json();
    console.log("Raw Meta Payload:", JSON.stringify(body));

    const objectType = body.object; // 'page', 'instagram', 'whatsapp_business_account'
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0]; // Messenger/Insta
    const change = entry?.changes?.[0]?.value; // WhatsApp usually comes here
    const waMessage = change?.messages?.[0];

    let senderId = null;
    let text = null;
    let channel = 'facebook'; 
    let recipientId = null;

    // A. Handle Facebook Messenger / Instagram Direct
    if (messaging) {
      senderId = messaging.sender.id;
      recipientId = messaging.recipient.id;
      text = messaging.message?.text;
      
      // If objectType is explicitly instagram, use that channel.
      // Or if the recipient ID matches the stored Instagram ID, we treat it as instagram.
      if (objectType === 'instagram') channel = 'instagram';
      
      console.log(`Processing Messenger/Insta: From ${senderId} to ID ${recipientId}`);
    } 
    // B. Handle WhatsApp
    else if (waMessage) {
      senderId = waMessage.from; 
      text = waMessage.text?.body;
      channel = 'whatsapp';
      recipientId = change.metadata?.phone_number_id; 
      console.log(`Processing WhatsApp: From ${senderId} to PhoneID ${recipientId}`);
    }

    // If packet doesn't contain a message (e.g. delivery receipt, read receipt), ignore it
    if (!senderId || !text || !recipientId) {
       console.log("Ignored non-message packet (delivery receipt etc.)");
       return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders });
    }

    recipientId = String(recipientId); // Ensure string for DB lookup

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
       
    // 4. Identify Tenant
    // We look for a user who has saved this Page ID, WhatsApp ID, OR Instagram ID
    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('user_id, auto_pilot_enabled')
      .or(`meta_page_id.eq.${recipientId},whatsapp_phone_id.eq.${recipientId},meta_instagram_id.eq.${recipientId}`)
      .maybeSingle();

    if (intError) console.error("DB Lookup Error:", intError.message);

    if (!integration) {
      console.error(`No tenant found for ID ${recipientId}. Check your Settings > Meta IDs.`);
      return new Response(`No tenant found for ID ${recipientId}`, { status: 200, headers: corsHeaders });
    }

    const userId = integration.user_id;

    // Check if channel needs adjustment based on DB match (e.g. if we matched on meta_instagram_id)
    // If the recipientId matched meta_instagram_id in our DB query, force channel to instagram
    // Note: This logic is implicit because we only have one row per user in integrations usually,
    // but if we want to be precise:
    // We can't easily know WHICH column matched in the .or() query without separate queries or fetching fields.
    // For now, if objectType was instagram, we trust it. If it was 'page', it's usually Facebook.

    if (objectType === 'instagram') channel = 'instagram';

    // 5. Find or Create Conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', senderId) // For Meta, 'phone' column stores the Scoped User ID (PSID)
      .eq('channel', channel)
      .maybeSingle();

    if (!conversation) {
       console.log("Creating new conversation...");
       const { data: newConv, error: createError } = await supabaseAdmin
         .from('conversations')
         .insert({
           user_id: userId,
           client_name: channel === 'whatsapp' ? `WA User ${senderId.slice(-4)}` : (channel === 'instagram' ? 'Insta User' : 'Meta User'),
           phone: senderId,
           channel: channel,
           last_message: text,
           status: 'new'
         })
         .select().single();
       
       if (createError) {
         console.error("Create Conv Error:", createError.message);
         throw createError;
       }
       conversation = newConv;
    } else {
       console.log(`Updating conversation ${conversation.id}`);
       await supabaseAdmin.from('conversations').update({ 
         last_message: text, 
         last_message_at: new Date().toISOString(), 
         status: 'new' 
       }).eq('id', conversation.id);
    }

    // 6. Insert Message
    if (conversation) {
       await supabaseAdmin.from('messages').insert({ 
         conversation_id: conversation.id, 
         sender: 'user', 
         text: text 
       });
       
       console.log("Message saved successfully.");

       // 7. AUTO-PILOT TRIGGER
       if (integration.auto_pilot_enabled) {
           console.log("Triggering Auto-Pilot...");
           const generateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-reply`;
           const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
           
           // Fire and forget (don't await)
           fetch(generateUrl, {
               method: 'POST',
               headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ conversation_id: conversation.id, action: 'reply_and_send', user_id: userId })
           }).catch(e => console.error("Auto-Pilot Fetch Error:", e));
       }
    }
    
    return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("Meta Webhook Fatal Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});