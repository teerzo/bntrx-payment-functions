// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


serve(async (req) => {
  console.log('req', req);
  const json = await req.json();
  console.log('json', json);

  let data = {
    message: '',
    orderId: '',
    patientEmail: '',
    status: '',
    date: ''
  }

  try {
    if (json) {
      if (json?.data?.object) {
        data.orderId = json.data.object?.client_reference_id ? json.data.object?.client_reference_id : 'no order id';
        data.patientEmail = json.data.object?.customer_details?.email ? json.data.object?.customer_details?.email : 'no patient email';
        data.status = json?.data?.object?.status;
        data.date = json?.data?.object?.created;
      }


      if (json.type === "checkout.session.completed") {
        const url = Deno.env.get('SUPABASE_URL');
        const jwtToken = Deno.env.get('SUPABASE_ANON_KEY');
        const response = await fetch(`${url}/functions/v1/glide-post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            orderId: data.orderId,
            patientEmail: data.patientEmail,
            status: data.status,
            date: data.date
          })
        })
        const glideRes = await response.json()
        if (!glideRes) {
          throw Error(glideRes);
        }
        return new Response(JSON.stringify({ message: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      else {
        data.message = `invalid event ${json.type}`;
      }
    }
    else {
      data.message = 'invalid body';
    }
  }
  catch (error) {
    console.log('error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To deploy 
// supabase functions deploy stripe-webhook --no-verify-jwt