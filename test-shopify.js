// test-graphql-fixed.js
require('dotenv').config();

const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

async function testGraphQL() {
  console.log('🔍 Testing GraphQL API with correct field names...\n');

  const query = `
    {
      customers(first: 3) {
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            numberOfOrders
            amountSpent {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    const data = await response.json();
    
    console.log('GRAPHQL RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.customers) {
      console.log('\n📋 Customer Data:');
      data.data.customers.edges.forEach((edge, index) => {
        const customer = edge.node;
        console.log(`\nCustomer ${index + 1}:`);
        console.log(`  ID: ${customer.id}`);
        console.log(`  Name: ${customer.firstName} ${customer.lastName}`);
        console.log(`  Email: ${customer.email || 'NULL'}`);
        console.log(`  Phone: ${customer.phone || 'NULL'}`);
        console.log(`  Orders: ${customer.numberOfOrders}`);
        console.log(`  Spent: ${customer.amountSpent.amount} ${customer.amountSpent.currencyCode}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testGraphQL();