

// Default canvas preview size
$('#canvasContainer').css({ width: 400 });

// Canvas preview size button
$('.previewSizeButton').on('click', function (e) {
  // Get the button's text (the name of the size)
  let sizeName = e.target.textContent;
  // Based on name, determine new size
  let sizeValue = 0;
  if (sizeName === 'Small') { sizeValue = 300; } else
    if (sizeName === 'Medium') { sizeValue = 400; } else
      if (sizeName === 'Large') { sizeValue = 500; }
  // Apply the new display size of the canvas
  $('#canvasContainer').css({ width: sizeValue });
})

// Download button
$('#downloadButton').on('click', function () {
  let link = document.createElement('a');
  link.download = 'Deck Back.png';
  link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");;
  link.click();
})




/*
============================================================================
Loading and app prep-work
============================================================================
*/


// Get and load graphics
// Note: Google Drive simple view link: https://drive.google.com/uc?id=FILE_ID
let imagesToPreload = [
  ['Burst', '../_resources/Villain deck back background.png'],
  ['Bars', '../_resources/Villain deck back bars.png'],
  ['Border', '../_resources/Villain deck back border.png'],
  ['test_ball', '../_resources/test_ball.png'],
  ['test_gyro', '../_resources/test_gyro.png'],
  ['test_shell', '../_resources/test_shell.png'],
  ['test_hyperspin', '../_resources/test_hyperspin.png'],
  ['test_name', '../_resources/Gyrosaur title.png']
]

// Make an object where each item is key = image name, value = Image element
let loadedGraphics = {};
for (let i = 0; i < imagesToPreload.length; i++) {
  let imageInfo = imagesToPreload[i];
  let newImage = new Image();
  newImage.src = imageInfo[1];
  loadedGraphics[imageInfo[0]] = newImage;
  // Draw the canvas once the final image has loaded
  if (i === imagesToPreload.length - 1) {
    newImage.onload = function (e) {
      drawCardCanvas();
    }
  }
}


// This object is where user input images (specifically Image objects) are stored
let loadedUserImages = {
  leftArt: null,
  rightArt: null,
  topArt: null,
  villainNameArt: null
};


// Handle user image uploading
$('.inputImageFile').on('input', function () {
  // Get the uploaded file
  let uploadedImage = this.files[0];
  // If a file has been uploaded...
  if (uploadedImage) {
    // Turn that file into a useable Image object
    let imagePurpose = this.dataset.imagePurpose;
    loadedUserImages[imagePurpose] = new Image();
    loadedUserImages[imagePurpose].src = URL.createObjectURL(uploadedImage);
    loadedUserImages[imagePurpose].onload = function () {
      // Once the Image has loaded, redraw the canvas so it immediately appears
      drawCardCanvas();
    }
  }
})


// Whenever one of the content inputs has its value changed (including each character typed in a text input), redraw the canvas
$('.contentInput').on('input', drawCardCanvas);

/*
============================================================================
Drawing the canvas
============================================================================
*/

// Draw the canvas from scratch (this function gets called whenever an input changes)
function drawCardCanvas() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset context states
  ctx.restore();
  ctx.save();

  // Draw a blank white rectangle background (for if no image so it's not awkwardly transparent)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Reset context states
  ctx.restore();
  ctx.save();

  // Draw the card background

  // Filter the colors of the background pieces that will be drawn

  /* old values
  let graphicFilter = 'grayscale(100%)              contrast(26%) brightness(150%)';
  let artFilter = 'grayscale(100%) brightness(150%) contrast(26%) brightness(150%)';
  */

  // I might want to try adding in a contrast(120%) filter to the artFilter, before the first brightness filter, to try to bring more consistent darks into the render

  let graphicFilter = 'grayscale(100%)              contrast(30%) brightness(145%)';
  let artFilter = 'grayscale(100%) contrast(150%) brightness(60%)';

  // 1-grayscale: makes monochromatic (when combined with color filter farther down in code)
  // 2-brightness: (artFilter only) compresses high end of value range (brings everything closer to "white")
  // 3-contrast: compresses whole value range (brings everything closer to a middle "gray")
  // 4-brightness: raises whole value range

  // Start with graphic filter
  ctx.filter = graphicFilter;

  // Blank background default
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Burst graphic
  ctx.drawImage(loadedGraphics['Burst'], 0, 0, canvas.width, canvas.height);

  // Switch to art filter (only slightly different)
  ctx.filter = artFilter;

  // Draw each art image in its cropped space
  drawArtInCroppedArea('vdb_topArt');
  drawArtInCroppedArea('vdb_leftArt');
  drawArtInCroppedArea('vdb_rightArt');

  // Return to graphic filter
  ctx.filter = graphicFilter;

  // Remove the drawing filter
  ctx.filter = 'none';
  ctx.save();

  // Get user input color settings
  let hue = $('#inputColorHueSlider').val();
  let saturation = $('#inputColorSaturationSlider').val();

  // Colorize the whole background
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = `rgb(148, 149, 153)`; // Max values: (360, 100%, 100%)
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over'; // Reset to normal drawing mode

  // Last of all, draw the card border
  ctx.globalCompositeOperation = 'source-over';
  // Bars graphic
  ctx.drawImage(loadedGraphics['Bars'], 0, 0, canvas.width, canvas.height);
  ctx.drawImage(loadedGraphics['Border'], 0, 0, canvas.width, canvas.height);

  // Draw the hero's name graphic
  drawArtInCroppedArea('vdb_villainNameArt');
}









/* NOTEPAD




*/