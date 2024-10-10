import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const table_name = process.env.table_name;



export const handler = async (event, context)=>{
    const short_url = event.queryStringParameters?.short_url;
    console.log(event.queryStringParameters?.short_url, "from the handler")
    if (!short_url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "short_url parameter is required" }),
        };
    }

    try {
        const long_url = await getLongUrl(short_url);

        if (!long_url) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "URL not found" }),
            };
        }

        const formattedLongUrl = formatLongUrl(long_url);

        return {
            statusCode: 302,
            headers: {
                Location: formattedLongUrl,
            },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}

const getLongUrl = async (short_url) => {
    const params = {
        TableName: table_name,
        Key: {
            short_url,
        },
    };

    try {
        const data = await docClient.send(new GetCommand(params));
        return data.Item ? data.Item.long_url : null;
    } catch (error) {
        throw new Error("Error fetching data from DynamoDB");
    }
};

const formatLongUrl = (long_url) => {
    return long_url.startsWith("http://") || long_url.startsWith("www.")
        ? `https://${long_url}`
        : long_url;
};

