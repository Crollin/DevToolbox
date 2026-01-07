// Script de test pour vérifier l'endpoint /api/tools/order
// Utilisation: node test-tool-order.js <token>

const token = process.argv[2];
const API_URL = 'http://localhost:1400';

if (!token) {
  console.error('Usage: node test-tool-order.js <token>');
  console.error('Obtenez un token en vous connectant via l\'interface web');
  process.exit(1);
}

async function testToolOrder() {
  const toolIds = ['wp-script-library', 'licence-key-hub', 'csv-preview-pro'];
  
  console.log('Test 1: GET /api/tools/order');
  try {
    const getResponse = await fetch(`${API_URL}/api/tools/order`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('Réponse:', getData);
  } catch (error) {
    console.error('Erreur GET:', error.message);
  }

  console.log('\nTest 2: PUT /api/tools/order');
  try {
    const putResponse = await fetch(`${API_URL}/api/tools/order`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ toolIds }),
    });
    console.log('Status:', putResponse.status);
    const putData = await putResponse.json();
    console.log('Réponse:', putData);
  } catch (error) {
    console.error('Erreur PUT:', error.message);
  }
}

testToolOrder();

