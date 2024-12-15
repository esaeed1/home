const { Client } = require('pg');

const connectionString = process.env.PG_CONNECTION_STRING;

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error connecting to database: ' + error.message }),
        };
    }

    if (event.httpMethod === 'GET') {
        const query = 'SELECT * FROM items';

        try {
            const res = await client.query(query);
            console.log('Query Result:', res.rows);  // Log query result

            // Ensure the result is an array
            const items = Array.isArray(res.rows) ? res.rows : [];

            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(items),  // Return items as an array
            };
        } catch (error) {
            await client.end();
            console.error('Error fetching items: ', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching items: ' + error.message }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};
