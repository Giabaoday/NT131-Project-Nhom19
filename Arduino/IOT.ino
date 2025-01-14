#include <SoftwareSerial.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Khai báo chân kết nối
#define ZIGBEE_RX 3  // Kết nối với TX của CC2530
#define ZIGBEE_TX 11  // Kết nối với RX của CC2530
#define ONE_WIRE_BUS 2  // Chân kết nối DS18B20
#define PH_PIN A0      // Chân kết nối cảm biến pH

SoftwareSerial zigbeeSerial(ZIGBEE_RX, ZIGBEE_TX);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);  // Debug
  zigbeeSerial.begin(9600);  // Giao tiếp với ZigBee
  sensors.begin();  // Khởi tạo DS18B20
  
}

void loop() {
  // Đọc nhiệt độ
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);
  
  // Đọc pH
  float pH = analogRead(PH_PIN) * 3.5 * 5.0 / 1024; // Điều chỉnh công thức theo datasheet
  
  // Tạo chuỗi dữ liệu để gửi
  String data = "T:" + String(temp) + ",pH:" + String(pH);
  
  // Gửi qua ZigBee
  zigbeeSerial.println(data);
  
  // Debug
  Serial.println(data);
  
  delay(1000);  // Đợi 1 giây trước khi đọc lại
}
