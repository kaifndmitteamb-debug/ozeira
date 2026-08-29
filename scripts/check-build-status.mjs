const NETLIFY_TOKEN = 'nfp_6FdSpyju32XNBCHtdv3Ceu6tm8vTLZdHc073';
const SITE_ID = '6c41a79f-3699-40d0-816f-aa0abe54f68a';
const DEPLOY_ID = '6a9307394d758425923a53d2';

async function main() {
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys/${DEPLOY_ID}`, {
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
  });
  const data = await res.json();
  console.log('Deploy state:', data.state);
  console.log('Deploy error_message:', data.error_message || 'None');
  console.log('Deploy URL:', data.ssl_url || data.url);
  console.log('Summary:', JSON.stringify(data.summary));
}

main().catch(console.error);
