const { Client } = require('pg');

// Hardcode your connection string here
const connectionString = 'postgresql://postgres:jJ2ACwM3sT0SsM7R@dutifully-accessible-ouzel.data-1.use1.tembo.io:5432/postgres';

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        console.log('Attempting to connect to the database...');
        await client.connect();
        console.log('Connected to the database!');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error connecting to database: ' + error.message }),
        };
    }

    if (event.httpMethod === 'GET') {
        const query = 'SELECT * FROM items';

        try {
            const res = await client.query(query);
            console.log('Query Result:', res.rows);
            const items = Array.isArray(res.rows) ? res.rows : [];
            await client.end();
            return {
                statusCode: 200,
                body: JSON.stringify(items),
            };
        } catch (error) {
            await client.end();
            console.error('Error fetching items:', error.message);
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
