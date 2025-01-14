import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDB({});
const dynamodb = DynamoDBDocument.from(client);

export const handler = async (event) => {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        const queryParams = event.queryStringParameters || {};
        console.log('Query parameters:', queryParams);
        const dataType = event.queryStringParameters?.type || 'aggregated';
        console.log('Data type:', dataType);
        if (dataType === 'raw') {
            // Lấy dữ liệu thô từ bảng raw_data
            const params = {
                TableName: 'sensor_data_table',
                KeyConditionExpression: 'device_id = :deviceId',
                ExpressionAttributeValues: {
                    ':deviceId': 'arduino_001'
                },
                Limit: 100,
                ScanIndexForward: false  // Sắp xếp theo thời gian mới nhất
            };
            console.log('Raw data params:', params);
            const data = await dynamodb.query(params);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data.Items)
            };
        } else {
            // Lấy dữ liệu thống kê
            const timeRange = event.queryStringParameters?.range || '1d';
            const rangeMap = {
                '1d': 24 * 60 * 60 * 1000,
                '1w': 7 * 24 * 60 * 60 * 1000,
                '1m': 30 * 24 * 60 * 60 * 1000
            };
            
            const params = {
                TableName: 'sensor_aggregated_data',
                KeyConditionExpression: '#interval = :interval AND #ts > :timestamp',
                ExpressionAttributeNames: {
                    '#interval': 'interval',
                    '#ts': 'timestamp'
                },
                ExpressionAttributeValues: {
                    ':interval': '5min',
                    ':timestamp': new Date(Date.now() - rangeMap[timeRange]).toISOString()
                }
            };
            
            const data = await dynamodb.query(params);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data.Items)
            };
        }
    } catch (err) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(err.message)
        };
    }
};