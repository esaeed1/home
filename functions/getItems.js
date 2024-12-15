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
            console.log(res.rows);  // Log the query result to debug

            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows),
            };
        } catch (error) {
            await client.end();
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
