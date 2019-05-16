const int playerPins[] = {
  3, 4, 5
};
int playerButtons[3];
const int ledPins[] = {
  10, 11, 12
};

int incoming = 0;

void setup() {
  Serial.begin(9600);
  for(int i : playerPins) {
    pinMode(i, INPUT_PULLUP);
//    Serial.print("Started button on port ");
//    Serial.println(i);
  }
  for(int i : ledPins) {
    pinMode(i, OUTPUT);
//    Serial.print("Started LED on port ");
//    Serial.println(i);
  }
}

void loop() {
  if(Serial.available() > 0) {
    incoming = Serial.read();
    Serial.println(incoming);
  }
  for(int i = 0; i < 3; i++) {
    playerButtons[i] = !digitalRead(playerPins[i]);
  }
  
  for(int i = 0; i < 3; i++) {
    while(playerButtons[i] == 1) {
      digitalWrite(ledPins[i], HIGH);
      playerButtons[i] = !digitalRead(playerPins[i]);
    }
    if(playerButtons[i] != 1) {
      digitalWrite(ledPins[i], LOW);
    }
  } 
}
