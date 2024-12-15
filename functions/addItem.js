const { Client } = require('pg');

// Your PostgreSQL connection string (use environment variables for production)
const connectionString = process.env.PG_CONNECTION_STRING;

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    await client.connect();

    if (event.httpMethod === 'POST') {
        const { name, upc, quantity, img, link } = JSON.parse(event.body);

        const query = `
            INSERT INTO items (name, upc, quantity, img, link)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const values = [name, upc, quantity, img, link];

        try {
            const res = await client.query(query, values);
            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows[0]),
            };
        } catch (error) {
            await client.end();
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error inserting item' }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};
