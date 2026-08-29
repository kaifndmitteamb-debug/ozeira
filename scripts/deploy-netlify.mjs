const NETLIFY_TOKEN = 'nfp_6FdSpyju32XNBCHtdv3Ceu6tm8vTLZdHc073';
const SITE_ID = '6c41a79f-3699-40d0-816f-aa0abe54f68a';

async function main() {
  console.log('Fetching site details from Netlify API...');
  const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
  });
  const siteData = await siteRes.json();
  console.log('Site name:', siteData.name);

  console.log('\nLinking GitHub repository kaifndmitteamb-debug/ozeira to Netlify...');
  const updateRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo_path: 'kaifndmitteamb-debug/ozeira',
        repo_branch: 'main',
        cmd: 'npm run build',
        dir: '.next'
      }
    })
  });
  
  const updateData = await updateRes.json();
  console.log('Update status:', updateRes.status);
  if (updateData.errors || updateData.message) {
    console.log('Update notice:', updateData.errors || updateData.message);
  }

  console.log('\nTriggering a new build on Netlify...');
  const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
  });
  console.log('Build trigger status:', buildRes.status);
  const buildData = await buildRes.json();
  console.log('Build data:', buildData);
}

main().catch(console.error);
