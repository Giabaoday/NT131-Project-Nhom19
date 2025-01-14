import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState('aggregated');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [dataType]);

  const fetchData = async () => {
    try {
      const url = `https://vltq4jaq38.execute-api.ap-southeast-1.amazonaws.com/dev/sensors?type=${dataType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      
      const data = JSON.parse(result.body);
      
      const formattedData = data.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleString(),
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setSensorData(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Đang tải dữ liệu...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500 text-lg">Lỗi: {error}</div>
    </div>
  );

  const latestData = sensorData[0] || {};

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Cảm Biến IoT
          </h1>
          <div className="flex items-center gap-4">
            <select 
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="aggregated">Dữ liệu thống kê</option>
              <option value="raw">Dữ liệu thô</option>
            </select>
          </div>
        </div>

        {/* Thẻ thông số mới nhất */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Nhiệt độ</div>
            <div className="text-3xl font-bold text-blue-600">
              {dataType === 'raw' 
                ? `${latestData.temperature || 'N/A'}°C`
                : `${latestData.avg_temperature || 'N/A'}°C`
              }
            </div>
            {dataType === 'aggregated' && (
              <div className="text-sm text-gray-600">
                Min: {latestData.min_temperature}°C - Max: {latestData.max_temperature}°C
              </div>
            )}
            <div className="text-sm text-gray-500 mt-2">
              Cập nhật: {latestData.timestamp || 'N/A'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Độ pH</div>
            <div className="text-3xl font-bold text-green-600">
              {dataType === 'raw' 
                ? `${latestData.pH || 'N/A'}`
                : `${latestData.avg_ph || 'N/A'}`
              }
            </div>
            {dataType === 'aggregated' && (
              <div className="text-sm text-gray-600">
                Min: {latestData.min_ph} - Max: {latestData.max_ph}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-2">
              Cập nhật: {latestData.timestamp || 'N/A'}
            </div>
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Biểu đồ nhiệt độ
            </h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  {dataType === 'raw' ? (
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#2563eb" 
                      name="Nhiệt độ (°C)"
                    />
                  ) : (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="avg_temperature" 
                        stroke="#2563eb" 
                        name="Nhiệt độ trung bình (°C)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="max_temperature" 
                        stroke="#9333ea" 
                        name="Nhiệt độ cao nhất (°C)"
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="min_temperature" 
                        stroke="#4f46e5" 
                        name="Nhiệt độ thấp nhất (°C)"
                        strokeDasharray="5 5"
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Biểu đồ pH
            </h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  {dataType === 'raw' ? (
                    <Line 
                      type="monotone" 
                      dataKey="pH" 
                      stroke="#16a34a" 
                      name="pH"
                    />
                  ) : (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="avg_ph" 
                        stroke="#16a34a" 
                        name="pH trung bình"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="max_ph" 
                        stroke="#84cc16" 
                        name="pH cao nhất"
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="min_ph" 
                        stroke="#22c55e" 
                        name="pH thấp nhất"
                        strokeDasharray="5 5"
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bảng lịch sử dữ liệu */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Lịch sử đo đạc
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhiệt độ (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Độ pH
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sensorData.slice(0, 10).map((reading, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dataType === 'raw' 
                        ? reading.temperature
                        : `${reading.avg_temperature} (${reading.min_temperature} - ${reading.max_temperature})`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dataType === 'raw'
                        ? reading.pH
                        : `${reading.avg_ph} (${reading.min_ph} - ${reading.max_ph})`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;