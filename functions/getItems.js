const { Client } = require('pg');

// Hardcoded connection string
const connectionString = 'postgresql://postgres:jJ2ACwM3sT0SsM7R@dutifully-accessible-ouzel.data-1.use1.tembo.io:5432/postgres';

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        // Connect to the PostgreSQL database
        await client.connect();
    } catch (error) {
        // Return an empty array instead of an error message
        return {
            statusCode: 500,
            body: JSON.stringify([]),
        };
    }

    if (event.httpMethod === 'GET') {
        const query = 'SELECT * FROM items';

        try {
            // Execute the query to fetch items from the database
            const res = await client.query(query);
            console.log(res.rows);  // Log the query result for debugging

            // Close the database connection
            await client.end();

            // Return the fetched items as JSON
            return {
                statusCode: 200,
                body: JSON.stringify(res.rows),
            };
        } catch (error) {
            // In case of error during the query execution
            await client.end();

            // Return an empty array instead of an error message
            return {
                statusCode: 500,
                body: JSON.stringify([]),
            };
        }
    }

    // If the HTTP method is not GET, return 405 Method Not Allowed
    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};
