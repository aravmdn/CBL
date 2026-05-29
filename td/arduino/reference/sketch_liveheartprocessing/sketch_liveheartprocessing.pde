import processing.serial.*;

Serial myPort;

float bpm = 0;

float[] graph = new float[300];

void setup() {

  size(1000, 800);

  println(Serial.list());

  myPort = new Serial(this, Serial.list()[1], 115200);
  myPort.bufferUntil('\n');

  for (int i = 0; i < graph.length; i++) {
    graph[i] = 70;
  }
}

void draw() {

  background(0);

  // small BPM text
  fill(255);
  textSize(20);
  textAlign(LEFT);

  if (bpm > 0) {
    text(int(bpm) + " BPM", 20, 30);
  } else {
    text("PLACE FINGER", 20, 30);
  }

  // graph
  stroke(255);
  strokeWeight(4);
  noFill();

  beginShape();

  for (int i = 0; i < graph.length; i++) {

    float x = map(i, 0, graph.length-1, 50, width-50);

    float y = map(graph[i], 40, 180,
                  height-80,
                  180);

    vertex(x, y);
  }

  endShape();

  // moving dot
  float lastY = map(graph[graph.length-1],
                    40, 180,
                    height-80,
                    180);

  noStroke();
  fill(255);
  ellipse(width-50, lastY, 12, 12);
}

void serialEvent(Serial myPort) {

  String data = myPort.readStringUntil('\n');

  if (data != null) {

    data = trim(data);

    try {

      bpm = float(data);

      for (int i = 0; i < graph.length-1; i++) {
        graph[i] = graph[i+1];
      }

      graph[graph.length-1] = bpm;

    } catch(Exception e) {
      println("Bad Data");
    }
  }
}
