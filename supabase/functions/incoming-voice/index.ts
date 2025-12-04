
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

serve(async (req) => {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;

    console.log(`Incoming Voice Call from ${from} to ${to}`);

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Identify the Business (User)
    // We try to find which user owns the 'To' phone number.
    let { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('phone_number', to)
      .maybeSingle();

    // Fuzzy match fallback for Integration (handle +1 or not)
    if (!integration) {
      const toNoPlus = to.replace(/^\+/, '');
      const { data: retryData } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('phone_number', toNoPlus)
        .maybeSingle();
      if (retryData) integration = retryData;
    }

    // Default TwiML if no user found
    if (!integration) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response>
           <Say>We could not find an account for this number.</Say>
         </Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    if (integration.voice_enabled === false) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response>
           <Say>This number does not accept voice calls.</Say>
         </Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const greeting = integration.voice_greeting || "Thanks for calling. How can I help you today?";
    const voiceId = integration.voice_id || "Polly.Joanna";
    const callbackUrl = `${(Deno as any).env.get('SUPABASE_URL')}/functions/v1/voice-action`;

    // 3. Construct TwiML
    // We use <Gather input="speech"> to listen to the user.
    // When they stop speaking, Twilio sends the text to 'callbackUrl'.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="${voiceId}">${greeting}</Say>
        <Gather input="speech" action="${callbackUrl}" method="POST" speechTimeout="auto" language="en-US">
            <Pause length="10" />
        </Gather>
        <Say voice="${voiceId}">I didn't hear anything. Goodbye.</Say>
    </Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error: any) {
    console.error("Voice Error:", error.message);
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response><Say>An application error occurred.</Say></Response>`,
        { headers: { "Content-Type": "text/xml" } }
    );
  }
});
