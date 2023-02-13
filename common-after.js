

// Regions for drawing images
imageAreas = {
  /*==========================================================
  Hero Character Card Front
  ==========================================================*/
  // Art in Foreground
  hccf_foregroundArt: {
    pathShape: coordinatesToPathShape([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('foregroundArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('foregroundArt');
    }
  },
  hccf_backgroundArt: {
    pathShape: coordinatesToPathShape([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      //return loadedGraphics['test_gyrosaur cc front'];
      return getUserImage('backgroundArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('backgroundArt');
    }
  },
  hccf_nemesisIcon: {
    pathShape: coordinatesToPathShape([
      [12, 91.5],
      [13, 90.5],

      [24, 90.5],
      [25, 91.5],

      [19, 96.25],
      [18, 96.25]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('nemesisIcon');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('nemesisIcon');
    }
  },
  /*==========================================================
  Hero Deck Back
  ==========================================================*/
  // Hero Name Art
  hdb_heroNameArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 2],
      [97.5, 2],
      [97.5, 45],
      [2.5, 45]
    ]),
    scaleStyle: 'fit',
    vAlign: 'top',
    getImage: function () {
      return getUserImage('heroNameArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('heroNameArt');
    }
  },
  // Left Art
  hdb_leftArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 32],
      [46, 25.5],
      [60.5, 65],
      [2.5, 77]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('leftArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('leftArt');
    }
  },
  // Right Art
  hdb_rightArt: {
    pathShape: coordinatesToPathShape([
      [46.5, 25.5],
      [97.5, 17],
      [97.5, 57.5],
      [61, 65]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('rightArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('rightArt');
    }
  },
  // Bottom Art
  hdb_bottomArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 78],
      [97.5, 58],
      [97.5, 98],
      [2.5, 98]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('bottomArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('bottomArt');
    }
  },
  /*==========================================================
  Villain Deck Back
  ==========================================================*/
  // Villain Name Art
  vdb_villainNameArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 80],
      [97.5, 80],
      [97.5, 100],
      [2.5, 100]
    ]),
    scaleStyle: 'fit',
    vAlign: 'top',
    getImage: function () {
      return getUserImage('villainNameArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('villainNameArt');
    }
  },
  // Top Art
  vdb_topArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 2.5],
      [97.5, 2.5],
      [97.5, 33],
      [65, 41],
      [2.5, 32]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('topArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('topArt');
    }
  },
  // Right Art
  vdb_leftArt: {
    pathShape: coordinatesToPathShape([
      [65, 41],
      [97.5, 33],
      [97.5, 90],
      [40, 81]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('rightArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('rightArt');
    }
  },
  // Left Art
  vdb_rightArt: {
    pathShape: coordinatesToPathShape([
      [2.5, 32],
      [65, 41],
      [40, 81],
      [2.5, 77]
    ]),
    scaleStyle: 'fill',
    vAlign: 'center',
    getImage: function () {
      return getUserImage('leftArt');
    },
    getAdjustments: function () {
      return getUserImageAdjustments('leftArt');
    }
  }
}

// Get the input image
function getUserImage(areaName) {
  return loadedUserImages[areaName];
}

// Get the input image adjustments
function getUserImageAdjustments(areaName) {
  let xOffset, yOffset, scale;
  // Get the user input percentages
  xOffset = $(`.inputImageOffsetX[data-image-purpose="${areaName}"]`).val() / 100;
  yOffset = $(`.inputImageOffsetY[data-image-purpose="${areaName}"]`).val() / 100 * -1;
  scale = $(`.inputImageScale[data-image-purpose="${areaName}"]`).val() / 100;
  // Return a nice object with those values
  let adjustments = {
    xOffset: xOffset,
    yOffset: yOffset,
    scale: scale
  }
  return adjustments;
}

// Function to handle creating and providing information about a region to draw an image inside
function coordinatesToPathShape(coordinates) {

  let pathShape = new Path2D(), rightmostX = pw(0), leftmostX = pw(100), bottommostY = ph(0), topmostY = ph(100);

  // Create the path shape by iterating through the coordinates
  for (let i = 0; i < coordinates.length; i++) {
    // Grab the pair of coordinates (and convert them from percentage values to canvas values)
    let x = pw(coordinates[i][0]), y = ph(coordinates[i][1]);

    // If first pair of coordinates, use moveTo to start shape
    if (i === 0) {
      pathShape.moveTo(x, y);
    }
    // Otherwise, use lineTo to continue shape
    else {
      pathShape.lineTo(x, y);
    }
    // Keep track of path extremes for centering the image later
    if (x > rightmostX) {
      rightmostX = x;
    }
    if (x < leftmostX) {
      leftmostX = x;
    }
    if (y > bottommostY) {
      bottommostY = y;
    }
    if (y < topmostY) {
      topmostY = y;
    }
  }
  // Close the path
  pathShape.closePath();

  // Deduce some more information to be used later
  let centerX = (leftmostX + rightmostX) / 2;
  let centerY = (topmostY + bottommostY) / 2;
  let width = rightmostX - leftmostX;
  let height = bottommostY - topmostY;
  let ratio = width / height;

  // Output an object containing the path shape and some information about it
  return {
    pathShape: pathShape,

    leftmostX: leftmostX,
    rightmostX: rightmostX,
    topmostY: topmostY,
    bottommostY: bottommostY,

    centerX: centerX,
    centerY: centerY,
    width: width,
    height: height,
    ratio: ratio
  };
}


function drawArtInCroppedArea(areaName) {

  // Get image area information
  let imageArea = imageAreas[areaName];
  let image = imageArea.getImage();
  let pathShape = imageArea.pathShape;
  let adjustments = imageArea.getAdjustments();
  let scaleStyle = imageArea.scaleStyle;
  let vAlign = imageArea.vAlign;

  // Stroke path - useful when working on a new image area
  // ctx.strokeStyle = 'green';
  // ctx.lineWidth = pw(1);
  // ctx.stroke(pathShape.pathShape);

  if (!image) { return } // Cancel function if there's no image to draw (placed here to allow test stroke to be drawn)

  // Save context before clip
  ctx.save();
  // Clip path shape
  ctx.clip(pathShape.pathShape);

  // Get image information
  let imageWidth = image.width;
  let imageHeight = image.height;
  let imageRatio = imageWidth / imageHeight;

  // Determine default scale of image by comparing image ratio to area shape ratio
  let initialScale = 1;
  if ((scaleStyle == 'fill' && imageRatio > pathShape.ratio) ||
    (scaleStyle == 'fit' && imageRatio < pathShape.ratio)) {
    // If image ratio is wider than image area ratio, fit to height
    initialScale = pathShape.height / imageHeight;
  }
  else {
    // Otherwise, fit to width
    initialScale = pathShape.width / imageWidth;
  }

  // Determine final scale of image based on user input
  let finalScale = initialScale * adjustments.scale;

  // Determine draw width and height
  let drawWidth = imageWidth * finalScale;
  let drawHeight = imageHeight * finalScale;

  // Determine draw X by centering, then adding user input offset
  let drawX = pathShape.centerX - drawWidth / 2;
  drawX += adjustments.xOffset * drawWidth;

  // Align image to that area's starting alignment, then add user input offset
  let drawY = 0;
  if (vAlign == 'center') {
    drawY = pathShape.topmostY + pathShape.height / 2 - drawHeight / 2;
    drawY += adjustments.yOffset * drawHeight;
  }
  else if (vAlign == 'top') {
    drawY = pathShape.topmostY;
    drawY += adjustments.yOffset * drawHeight;
  }


  // Finally, draw the image to the canvas!
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  // Release clip
  ctx.restore();
  ctx.save();
}

function parseAndDrawCardEffectBlock(args = {}) {
  // parsing argument hash
  block = args["block"] || "";
  effectStartX = args["startX"] || 0;
  effectStartY = args["startY"] || 0;
  effectBaseFontSize = args["baseFontSize"] || pw(4.05);
  effectFontSize = args["fontSize"] || effectBaseFontSize;
  prePhaseLineHeightFactor = args["phaseLineHeightFactor"] || 0;


  // Reset indent to default
  currentIndentX = effectStartX;

  // Check for the first block to adjust whole effect text starting Y position
  if (index == 0) {
    // Adjust (bring the text up a little more when it's smaller)
    currentOffsetY -= effectBaseFontSize;
    currentOffsetY += effectFontSize;
  }

  // We've gotten the text block, time to get the individual words from it and draw them appropriately
  let blockString = block;

  // Replace spaces after numbers (and X variables) with non-breaking spaces
  blockString = blockString.replaceAll(/([0-9X]) /g, '$1\xa0'); // Non-breakable space is char 0xa0 (160 dec)

  // Check for phase labels, such as START PHASE
  let isPhase = false; let phaseName = ''; let testString = '';
  // Create test string by getting first two words of block string
  let blockWords = blockString.split(' ');
  // Account for formats like "> Start Phase" by checking for length of first "word"
  let numberOfLabelWords = 0;
  if (blockWords[0].length < 2) {
    testString = stripStringOfCapitalizationAndPunctuation(blockWords[1] + ' ' + blockWords[2]);
    numberOfLabelWords = 3;
  }
  else {
    testString = stripStringOfCapitalizationAndPunctuation(blockWords[0] + ' ' + blockWords[1]);
    numberOfLabelWords = 2;
  }
  // Compare first two actual words to possible phases
  if (testString === 'start phase') {
    isPhase = true; phaseName = 'Start Phase';
  }
  else if (testString === 'play phase') {
    isPhase = true; phaseName = 'Play Phase';
  }
  else if (testString === 'power phase') {
    isPhase = true; phaseName = 'Power Phase';
  }
  else if (testString === 'draw phase') {
    isPhase = true; phaseName = 'Draw Phase';
  }
  else if (testString === 'end phase') {
    isPhase = true; phaseName = 'End Phase';
  }

  // If this is a phase label block...
  if (isPhase) {
    // Adjust line height, differently depending on if this is the first block or not
    if (index == 0) {
      currentOffsetY = effectStartY + savedBoxHeightOffset;
    }
    else {
      currentOffsetY = currentOffsetY - lineHeight + lineHeight * prePhaseLineHeightFactor;
    }
    // Get the phase label icon
    let iconString = phaseName + ' Icon';
    if (useHighContrastPhaseLabels) iconString += ' High Contrast';
    let thisIcon = loadedGraphics[iconString];
    // Style and draw the iconcon
    const effectPhaseIconX = pw(8.9); // Keep the icon aligned to left edge of text box
    let iconWidth = pw(5);
    let iconHeight = iconWidth; // These graphics have 1:1 proportions
    let iconX = effectPhaseIconX - iconWidth / 2;
    let iconY = currentOffsetY - effectPhaseFontSize;// iconHeight/2;
    ctx.drawImage(thisIcon, iconX, iconY, iconWidth, iconHeight);

    // Style and draw the text after the icon
    // Set basic font properties
    ctx.font = '400 ' + effectPhaseFontSize + 'px ' + effectPhaseFontFamily;
    // Get phase color
    let phaseColor = '';
    if (useHighContrastPhaseLabels) {
      switch (phaseName) {
        case 'Start Phase': phaseColor = colorStartPhaseHighContrast; break;
        case 'Play Phase': phaseColor = colorPlayPhaseHighContrast; break;
        case 'Power Phase': phaseColor = colorPowerPhaseHighContrast; break;
        case 'Draw Phase': phaseColor = colorDrawPhaseHighContrast; break;
        case 'End Phase': phaseColor = colorEndPhaseHighContrast; break;
      }
    }
    else {
      switch (phaseName) {
        case 'Start Phase': phaseColor = colorStartPhaseOriginal; break;
        case 'Play Phase': phaseColor = colorPlayPhaseOriginal; break;
        case 'Power Phase': phaseColor = colorPowerPhaseOriginal; break;
        case 'Draw Phase': phaseColor = colorDrawPhaseOriginal; break;
        case 'End Phase': phaseColor = colorEndPhaseOriginal; break;
      }
    }

    // Font stroke
    ctx.strokeStyle = colorBlack;
    ctx.lineWidth = effectPhaseFontSize * 0.2;
    ctx.lineJoin = "miter";
    ctx.miterLimit = 3;
    ctx.strokeText(phaseName, currentOffsetX, currentOffsetY);
    // Font fill
    ctx.fillStyle = phaseColor;
    ctx.fillText(phaseName, currentOffsetX, currentOffsetY);

    // Prepare for next block
    currentOffsetY = currentOffsetY + lineHeight * postPhaseLineHeightFactor;

    // If the user put the effect on the same line as the label, draw a new block with that effect
    // Bug: "END PHASE: Here we go"
    if (blockWords.length > numberOfLabelWords) {
      // Abort if the rest of the line is just a single space (there's probably a more robust way to handle this kind of potential issue, but it's not very important. Maybe using String.prototype.trim().)
      if (blockWords.length === numberOfLabelWords + 1 && blockWords[blockWords.length - 1] == '') {
        return;
      }
      // Remove phase label words
      blockWords.splice(0, numberOfLabelWords);
      // Rejoin the remaining words into a string
      let newBlockString = blockWords.join(' ');
      // Run the block drawing function again on this new string
      parseAndDrawCardEffectBlock(newBlockString, index);
      // Stop processing this block
      return;
    }
    else {
      // If the line was just the phase labels, simply stop processing the block here
      return;
    }

  }

  // Check for POWER: and REACTION:
  let isIndentBlock = false; let labelWord = ''; let testStringPR = '';
  // Create test string by getting first word of block string
  let blockWordsPR = blockString.split(' ');
  testStringPR = blockWordsPR[0].toLowerCase();
  if (testStringPR === 'power:') {
    isIndentBlock = true;
    labelWord = 'POWER:';
  }
  else if (testStringPR === 'reaction:') {
    isIndentBlock = true;
    labelWord = 'REACTION:';
  }
  else if (testStringPR === '>' || testStringPR === '-') {
    isIndentBlock = true;
    labelWord = '»';
  }

  // If it's a POWER: or REACTION:, draw that label and then prepare the rest of the block for being indented
  if (isIndentBlock) {
    // Draw POWER:
    ctx.fillStyle = colorBlack;
    let effectPowerFontSize = effectFontSize * effectPowerFontSizeFactor;
    ctx.font = '900 ' + effectPowerFontSize + 'px ' + effectPowerFontFamily;
    // Slightly different for incap bullets
    if (labelWord == '»') {
      ctx.font = '400 ' + effectPowerFontSize + 'px ' + effectPowerFontFamily;
    }
    ctx.fillText(labelWord, currentOffsetX, currentOffsetY);
    // Prepare for the rest of the text
    // Prepare indent
    let powerWidth = ctx.measureText(labelWord).width + spaceWidth;
    currentIndentX += powerWidth + pw(0.2);
    // Add a little more indent for bullet point
    if (labelWord == '»') {
      currentIndentX += pw(1);
    }
    currentOffsetX = currentIndentX;
    // Remove the POWER:/REACTION: from block string
    //var result = original.substr(original.indexOf(" ") + 1);
    if (blockString.length === labelWord.length) {
      // For edge case where the whole block string is just 'POWER:', so it doesn't draw twice and look weird
      blockString = '';
    }
    else {
      blockString = blockString.substr(blockString.indexOf(" ") + 1);
    }

  }

  // Okay, time for handling normal body text...

  // First, identify special word strings and replace their spaces with underscores
  effectBoldList.forEach((phrase) => {
    // Make an all-caps copy of the block string
    let testString = blockString.toUpperCase();
    // Find the position of each instance of this phrase in the string
    let position = testString.indexOf(phrase);
    while (position !== -1) {
      // Replace this instance of this phrase in the real block string with the all-caps + underscore format for detecting later
      let thisSubString = blockString.substr(position, phrase.length);
      blockString = blockString.replace(thisSubString, phrase.replaceAll(' ', '_'));
      // Repeat if there's another instance of this phrase
      position = testString.indexOf(phrase, position + 1);
    }
  })
  effectItalicsList.forEach((phrase) => {
    // Make an all-caps copy of the block string
    let testString = blockString.toUpperCase();
    // Find the position of each instance of this phrase in the string
    let position = testString.indexOf(phrase);
    while (position !== -1) {
      // Replace this instance of this phrase in the real block string with the all-caps + underscore format for detecting later
      let thisSubString = blockString.substr(position, phrase.length);
      blockString = blockString.replace(thisSubString, phrase.replaceAll(' ', '_'));
      // Repeat if there's another instance of this phrase
      position = testString.indexOf(phrase, position + 1);
    }
  })

  // Make minus signs more readable by replacing hyphens with en-dashes
  blockString = blockString.replaceAll('-', '–');

  // Extract all the words
  let words = blockString.split(' ');

  // Analyze and draw each 'word' (including special phrases as 1 word...U.u)
  words.forEach((word, index) => {
    let thisIndex = index;
    // Find out it this word should be bolded or italicized
    let thisWord = getWordProperties(word); // returns an object: {text, isBold, isItalics}

    // Set drawing styles
    let weightValue = effectFontWeight;
    let styleValue = "normal";
    if (thisWord.isBold) { weightValue = "600" }
    if (thisWord.isItalics) { styleValue = "italic" }
    ctx.font = weightValue + ' ' + styleValue + ' ' + effectFontSize + 'px ' + effectFontFamily;
    ctx.fillStyle = colorBlack;

    // Break up special bold/italics phrases into their component words
    let phraseParts = thisWord.text.split(' ');

    // For each word in the phrase (and there will usually be just one)
    phraseParts.forEach((wordString) => {
      // Get how much width the word and a space would add to the line
      let wordWidth = ctx.measureText(wordString).width;
      // Check to see if the line should wrap
      let wrapped = false;
      // Looks forward to see if adding this word to the current line would make the line exceed the maximum x position
      if (currentOffsetX + spaceWidth + wordWidth > effectEndX) {
        // If it would, then start the next line
        currentOffsetY += lineHeight;
        currentOffsetX = currentIndentX;
        wrapped = true;
      }
      // Determine string to draw
      let stringToDraw = '';
      // Check if there's a punctuation mark at the end of a bold/italicized word
      let endingPunctuation = '';
      if ((thisWord.isBold || thisWord.isItalics) && wordString[wordString.length - 1].match(/[.,!;:\?]/g)) {
        endingPunctuation = wordString.charAt(wordString.length - 1); // Get the punctuation at the end of the string
        wordString = wordString.slice(0, wordString.length - 1); // Remove the punctuation from the main string
      }

      // Check line wrapping status
      if (wrapped == false && thisIndex > 0) {
        // If the line did not wrap and it's not the first word of the block, draw the word with a space
        currentOffsetX += spaceWidth;
        stringToDraw = wordString;
        // Draw the string
        ctx.fillText(stringToDraw, currentOffsetX, currentOffsetY);
        // If there was ending punctuation after a bold/italicized word, draw that now
        if (endingPunctuation != '') {
          // Get width of word without ending punctuation
          let mainWordWidth = ctx.measureText(stringToDraw).width;
          // Set the font styles to effect text default
          ctx.font = effectFontWeight + ' ' + 'normal' + ' ' + effectFontSize + 'px ' + effectFontFamily;
          // Draw the punctuation
          let drawX = currentOffsetX + mainWordWidth;
          ctx.fillText(endingPunctuation, drawX, currentOffsetY);
        }
        // Prepare currentOffsetX for next word
        currentOffsetX += wordWidth;
      }
      else {
        // If the line wrapped (or if it was the first word in the whole block), draw the word with no space
        stringToDraw = wordString;
        // Draw the string
        ctx.fillText(stringToDraw, currentOffsetX, currentOffsetY);
        // If there was ending punctuation after a bold/italicized word, draw that now
        if (endingPunctuation != '') {
          // Get width of word without ending punctuation
          let mainWordWidth = ctx.measureText(stringToDraw).width;
          // Set the font styles to effect text default
          ctx.font = effectFontWeight + ' ' + 'normal' + ' ' + effectFontSize + 'px ' + effectFontFamily;
          // Draw the punctuation
          let drawX = currentOffsetX + mainWordWidth;
          ctx.fillText(endingPunctuation, drawX, currentOffsetY);
        }
        // Prepare currentOffsetX for next word
        currentOffsetX += wordWidth;
      }

      // Increase the index (only necessary for multi-word phrases)
      thisIndex++;
    })


  })

  // After drawing all the words, prepare for the next block
  currentOffsetX = effectStartX;
  currentOffsetY += lineHeight * blockSpacingFactor;
}





