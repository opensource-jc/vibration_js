# vibration_js
The idea of the script is to be able to measure amplitude of sound captured by the microphone and at the same time measure the vibrations detected by the device's gyroscope. It uses [Chart.js](https://www.chartjs.org/) to display the measurements.

## Procedure
The script displays a button to start and stop the logging process. Once the process is started the following happens:

1. Based on https://whatwebcando.today/device-motion.html I take the variation of angles in the device through it's gyroscope. But instead of working with them individually, I join them together through Pitagoras.

+ My reasoning for applying Pitagoras is that the forces that produce the angle changes would be perpendicular in a 3D space defined by the coordinate system of the device's position.
![angles](https://developers.google.com/web/updates/images/2017/09/sensors/gyroscope.gif)

+ Image taken from https://developers.google.com/web/updates/2017/09/sensors-for-the-web

+ Unfortunately, I don't have enough knowledge of physics to determine the energy or the force in units. So the results are for visual analysis or relative comparison.

2. Based on https://github.com/cwilso/volume-meter/ I take the amplitude of the wave and log it along with the time in milliseconds since the start of the process.

3. Based on https://developers.google.com/web/fundamentals/media/recording-audio I record the audio so it can be downloaded along with the results.

4. The times and values are logged and the arrays are displayed on a chart (Chart.js)

5. When the stop button is pressed, three downloads are enabled: the audio and the two logs in csv format.

## Demo
The code can be seen at work in : https://opensource-jc.github.io/vibration_js/