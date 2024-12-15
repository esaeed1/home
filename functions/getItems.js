const { Client } = require('pg');

const connectionString = process.env.PG_CONNECTION_STRING;

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    await client.connect();

    if (event.httpMethod === 'GET') {
        const query = 'SELECT * FROM items';

        try {
            const res = await client.query(query);
            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows),
            };
        } catch (error) {
            await client.end();
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching items' }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};
