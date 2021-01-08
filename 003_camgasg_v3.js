// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: camera;

// script by Andre Löffelmann (https://talk.automators.fm/u/bergbiber/summary)
// edit by GSG (https://linktr.ee/gsg_mcmxcii)
// usecase: Widget Scriptable for Foto-Webcam.eu
// Verison 0.1: (only one webcam)
// description: coming soon 

// error-variables
const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️";

// SCRIPT

var camURLstveit = "https://www.foto-webcam.eu/webcam/stveit/"
var camURLhopfgarten = "https://www.foto-webcam.eu/webcam/hopfgarten/"

let fullSizeImage = await new Request(camURLstveit + "/current/400.jpg").loadImage() // var for fullsize webcam

let croppedImage = await processImage(fullSizeImage) // var for cropped images

var widget = new ListWidget()
widget.backgroundImage = croppedImage

if (config.runsInApp) {
    // display-preview-widget
	widget.presentMedium(); // other options are '.presentSmall()' or '.presentLarge()'
    console.log(`icon="${PASS}" action="display-preview-widget" message="widget preview displayed"`)

} else {
    // finalize-widget
    Script.setWidget(widget)
    console.log(`icon="${PASS}" action="finalize-widget" message="widget has been set"`)

}

Script.complete()

// FUNCTIONS

 async function createWidget(croppedImage) {
     var result = new ListWidget();
    result.backgroundImage = croppedImage
	result.addText(croppedImage.size.width.toString());
	result.addText(croppedImage.size.height.toString());
    return result;
}

// This function takes an image and returns a processed image.
async function processImage(image) {

    const imageId = "imageId"
    const canvasId = "canvasId"

    const js = `
  // Set up the canvas.
  const img = document.getElementById("${imageId}");
  const canvas = document.getElementById("${canvasId}");
  const w = 400;
  const h = 190;
  canvas.style.width  = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  context.clearRect( 0, 0, w, h );
  context.drawImage( img, 0, 0, w, h, 0,0, w,h );
  

  // Image modifications go here. This desaturates the image.
  // context.globalCompositeOperation = "saturation";
  // context.fillStyle = "hsl(0,0%,50%)";
  // context.fillRect(0, 0, w, h);
  // Return a base64 representation.
  canvas.toDataURL(); 
  `

    // Convert the images and create the HTML.
    let inputData = Data.fromPNG(image).toBase64String()
    let html = `
  <img id="${imageId}" src="data:image/png;base64,${inputData}" />
  <canvas id="${canvasId}" />
  `

    // Make the web view and get its return value.
    let view = new WebView()
    await view.loadHTML(html)
    let returnValue = await view.evaluateJavaScript(js)

    // Remove the data type from the string and convert to data.
    let outputDataString = returnValue.slice(returnValue.indexOf(",") + 1)
    outputData = Data.fromBase64String(outputDataString)

    // Convert to image and return.
    return Image.fromData(outputData)
}