const { Client } = require('pg');

const connectionString = 'postgresql://postgres:jJ2ACwM3sT0SsM7R@dutifully-accessible-ouzel.data-1.use1.tembo.io:5432/postgres';

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
    } catch (error) {
        console.error('Error connecting to database:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error connecting to database: ' + error.message }),
        };
    }

    if (event.httpMethod === 'GET') {
        const query = 'SELECT * FROM items';

        try {
            console.log('Executing query:', query); // Log the query being executed
            const res = await client.query(query);
            console.log('Query result:', res.rows); // Log the rows returned by the query

            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows),
            };
        } catch (error) {
            console.error('Error fetching items:', error);
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
