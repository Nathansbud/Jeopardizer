import jssc.SerialPort;
import jssc.SerialPortEvent;
import jssc.SerialPortException;
import jssc.SerialPortList;

import static jssc.SerialPort.MASK_RXCHAR;

public class BuzzerTest {
    private static SerialPort buzzerPort = null;

    private static boolean setupBuzzers(String port) {
        System.out.println("Setting up buzzers...");
        boolean passed = false;
        SerialPort serialPort = new SerialPort(port);
        try {
            serialPort.openPort();
            serialPort.setParams(SerialPort.BAUDRATE_9600, SerialPort.DATABITS_8, SerialPort.STOPBITS_1, SerialPort.PARITY_NONE);
            serialPort.setEventsMask(MASK_RXCHAR);

            serialPort.addEventListener((SerialPortEvent event) -> {
                System.out.println(event);

                if (event.isRXCHAR() && event.getEventValue() > 0) {
                    try {
                        byte[] b = serialPort.readBytes();
                        int value = b[0] & 0xff;    //convert to int
                        System.out.println(String.valueOf(value));
                    } catch (SerialPortException ex) {
                        System.out.println("Read failed!");
                    }
                }
            });

            buzzerPort = serialPort;
            passed = true;
        } catch (SerialPortException ex) {
            System.out.println("SerialPortException: " + ex.toString());
        }
        return passed;
    }



    public static void main(String[] args) {
        String[] ports = SerialPortList.getPortNames();
        if(!setupBuzzers(ports[0])) {
            System.out.println("Buzzer setup failed!");
        } else {
            System.out.println("Buzzer setup passed!");
        }
        try {
            buzzerPort.readString();
        } catch(SerialPortException e) {
            System.out.println("BIG SAD");
        }
    }
}
