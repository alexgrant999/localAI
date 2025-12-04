
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

serve(async (req) => {
  try {
    // 1. Parse Twilio Form Data (Twilio sends application/x-www-form-urlencoded)
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    console.log(`Received SMS from ${from} to ${to}: ${body}`);

    if (!from || !to) {
      return new Response("Missing 'From' or 'To' fields", { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    // We need the SERVICE_ROLE_KEY to search across all users (integrations table) 
    // to find who owns this phone number.
    const supabaseAdmin = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Identify the Business (User) based on the 'To' phone number
    // We look up which user has integrated this Twilio number.
    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('phone_number', to)
      .single();

    if (intError || !integration) {
      console.error(`No integration found for business number: ${to}`);
      // Return 200 to Twilio so it stops retrying, even though we couldn't process it.
      return new Response("No tenant found for this number", { status: 200 });
    }

    const userId = integration.user_id;

    // 4. Find or Create the Conversation
    // We look for an existing chat with this specific client ('From' number) for this user.
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', from)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userId,
          phone: from,
          client_name: 'New Lead', // You could look up CallerName if Twilio provides it
          last_message: body,
          status: 'new'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      conversation = newConv;
    } else {
      // Update existing conversation
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message: body,
          last_message_at: new Date().toISOString(),
          status: 'new' // Mark as unread/new
        })
        .eq('id', conversation.id);
    }

    // 5. Insert the Message
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      sender: 'user', // Sent by the client
      text: body
    });

    // 6. Return TwiML
    // An empty TwiML response tells Twilio "We received it, no auto-reply via SMS needed"
    // (Since our AI will likely reply via the app logic separately)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error: any) {
    console.error("Incoming SMS Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});