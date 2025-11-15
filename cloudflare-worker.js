// Cloudflare Worker for Element Blur License Validation
// Deploy with: wrangler deploy
// Docs: https://developers.cloudflare.com/workers/

export default {
  async fetch(request, env) {
    // CORS headers for Chrome extension
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    try {
      // Parse request body
      const body = await request.json();
      const { license_key, email, product, version } = body;

      // Validate input
      if (!license_key) {
        return new Response(
          JSON.stringify({
            valid: false,
            message: 'License key is required'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      // Validate with LemonSqueezy API
      const lsResponse = await fetch(
        'https://api.lemonsqueezy.com/v1/licenses/validate',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            license_key: license_key,
            instance_name: email || 'chrome-extension',
          }),
        }
      );

      if (!lsResponse.ok) {
        throw new Error('LemonSqueezy API error: ' + lsResponse.status);
      }

      const data = await lsResponse.json();

      // Check if license is valid and active
      const isValid = data.valid === true && data.license_key?.status === 'active';

      // Check activation limit if exists
      const activationLimit = data.license_key?.activation_limit;
      const activationUsage = data.license_key?.activation_usage;
      const limitReached = activationLimit && activationUsage >= activationLimit;

      // Prepare response
      const response = {
        valid: isValid && !limitReached,
        message: isValid
          ? (limitReached
              ? 'License activated on maximum number of devices. Please deactivate on another device.'
              : 'License activated successfully!')
          : 'Invalid or inactive license key',
        data: isValid ? {
          email: data.meta?.customer_email,
          customer_name: data.meta?.customer_name,
          product_name: data.meta?.product_name,
          variant_name: data.meta?.variant_name,
          activated_at: new Date().toISOString(),
          activation_limit: activationLimit,
          activation_usage: activationUsage,
          expires_at: data.license_key?.expires_at,
          status: data.license_key?.status,
        } : null,
      };

      // Log validation (optional - can be removed)
      console.log('License validation:', {
        key: license_key.substring(0, 10) + '...',
        valid: isValid,
        email: data.meta?.customer_email,
      });

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );

    } catch (error) {
      console.error('Validation error:', error);

      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Validation failed: ' + error.message,
          error: error.toString(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
