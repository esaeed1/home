const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabase = createClient(
    'https://ymyztsxdqmiklnsjurhq.supabase.co',  // Your Supabase URL
    'haWsh0ANKNZQ78oN+qpdQDLVbzi29QT//cY4q2wYF64LAzfXTU08NVZId5V7+cQ1v/R/FsDQCZp1oelO1OCQQg==' // Your Supabase API key
);

exports.handler = async function(event, context) {
    if (event.httpMethod === 'GET') {
        try {
            // Fetch items from the Supabase database
            const { data, error } = await supabase
                .from('items')  // 'items' is the table in Supabase
                .select('*');   // Select all columns

            if (error) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Error fetching items: ' + error.message }),
                };
            }

            console.log(data);  // Log the query result for debugging
            return {
                statusCode: 200,
                body: JSON.stringify(data),  // Send the fetched items as the response
            };
        } catch (error) {
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
