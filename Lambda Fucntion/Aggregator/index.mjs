import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDB({});
const dynamodb = DynamoDBDocument.from(client);

const calculateStats = (data) => {
    if (!data || data.length === 0) {
        console.log('No data to calculate stats');
        return null;
    }

    try {
        const temps = data.map(item => Number(item.temperature));
        const phs = data.map(item => Number(item.pH));
        
        // Kiểm tra nếu có ít nhất 1 mẫu dữ liệu
        if (temps.length > 0 && phs.length > 0) {
            return {
                avg_temperature: Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2)),
                min_temperature: Number(Math.min(...temps).toFixed(2)),
                max_temperature: Number(Math.max(...temps).toFixed(2)),
                avg_ph: Number((phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2)),
                min_ph: Number(Math.min(...phs).toFixed(2)),
                max_ph: Number(Math.max(...phs).toFixed(2)),
                sample_count: data.length
            };
        }
        return null;
    } catch (error) {
        console.error('Error calculating stats:', error);
        return null;
    }
};

export const handler = async (event) => {
    try {
        const INTERVAL = 5 * 60;
        const now = new Date();
        const startTime = new Date(now.getTime() - (INTERVAL * 1000)).toISOString();
        const endTime = now.toISOString();

        console.log('Query time range:', { startTime, endTime });

        const rawParams = {
            TableName: 'sensor_data_table',
            KeyConditionExpression: 'device_id = :deviceId AND #ts BETWEEN :start AND :end',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':deviceId': 'arduino_001',
                ':start': startTime,
                ':end': endTime
            }
        };

        const rawData = await dynamodb.query(rawParams);
        console.log('Query results:', rawData.Items?.length || 0, 'items');
        
        if (!rawData.Items || rawData.Items.length === 0) {
            console.log('No data found in time range');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No data in time range' })
            };
        }

        const stats = calculateStats(rawData.Items);
        
        if (!stats) {
            console.log('Unable to calculate stats');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Unable to calculate stats' })
            };
        }

        const aggregatedItem = {
            interval: '5min',
            timestamp: endTime,
            device_id: 'arduino_001',
            gateway_id: rawData.Items[0].gateway_id,
            ...stats
        };

        console.log('Saving aggregated data:', aggregatedItem);

        await dynamodb.put({
            TableName: 'sensor_aggregated_data',
            Item: aggregatedItem
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success', data: aggregatedItem })
        };
        
    } catch (error) {
        console.error('Error in handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    }
};