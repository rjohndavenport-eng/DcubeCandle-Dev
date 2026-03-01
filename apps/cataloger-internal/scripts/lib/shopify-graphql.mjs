import fetch from 'node-fetch';

/**
 * Executes a GraphQL query against the Shopify Admin API.
 * @param {string} query - The GraphQL query.
 * @param {object} variables - Variables for the query.
 * @param {string} store - The Shopify store domain (e.g., dcubecandle.myshopify.com).
 * @param {string} token - The Shopify Admin API access token.
 * @param {string} apiVersion - The Shopify API version (default: 2025-01).
 * @returns {Promise<object>} The GraphQL result.
 */
export async function shopifyGraphql(query, variables = {}, store, token, apiVersion = '2025-01') {
  const url = `https://${store}/admin/api/${apiVersion}/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(`Shopify GraphQL Error: ${JSON.stringify(data.errors || data, null, 2)}`);
  }

  // Handle rate limiting headers (X-Shopify-Shop-Api-Call-Limit)
  const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (callLimit) {
    const [used, max] = callLimit.split('/').map(Number);
    if (used > max * 0.9) {
      console.warn(`[WARN] API Rate limit reached: ${used}/${max}. Sleeping...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return data.data;
}
