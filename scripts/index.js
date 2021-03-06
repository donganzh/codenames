/*
Notes: 
'data' is lazily imported from the html
'seedrandom' is also imported from html. it gives deterministic random #s based on a seed set in fire()
*/

var wordsSelected = [];
var teams = [];
var NUMBER_OF_WORDS = 25;
var spyMasterMode = false;
var sessionData = [];
var customData = [];

var colors = {
  red: "#ca405f",
  yellow: "#d1bba3",
  blue: "#5478b1",
  black: "#808080",
  green: "#798e5c"
};

//init
$("#seed").keyup(function() {
  fire();
});

$("#gameMode").change(function() {
  fire();
});

function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  var items = document.location.search.substr(1).split("&");
  for (var index = 0; index < items.length; index++) {
    tmp = items[index].split("=");
    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
  }
  return result;
}

/**
 * Copies some text to clipboard
 * @param {string} text
 *
 * @returns {Promise}
 */
function copyToClipboard(text) {
  if ("clipboard" in navigator) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for Safari and IE
  return new Promise(function(resolve, reject) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject();
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

if (document.location.hash.length > 1) {
  var seed = document.location.hash.substr(1);
  console.log("Setting seed to " + seed);
  $("#seed").val(document.location.hash.substr(1));
} else {
  $("#seed").val(Math.floor(Math.random() * 1000));
}

var gameModeChildren = $("#gameMode").children();
var GAME_MODES = [];
for (var i = 0; i < gameModeChildren.length; i++) {
  GAME_MODES.push(gameModeChildren[i].value);
}
var gamemode = parseInt(findGetParameter("gm"));

if (gamemode !== null) {
  if (
    Number.isNaN(gamemode) ||
    gamemode >= gameModeChildren.length ||
    gamemode < 0
  ) {
    gamemode = 0;
  }

  $("#gameMode")
    .val(GAME_MODES[gamemode])
    .change();
}

fire();

function fire() {
  //get seed and set the seed for randomizer
  var seed = document.getElementById("seed").value;
  Math.seedrandom(seed.toLowerCase());

  var option = $("#gameMode :selected").val();
  switch (option) {
    case "spanish":
      sessionData = spanishData.slice(0);
      break;
    case "2knouns":
      sessionData = data.slice(0);
      break;
    case "movies":
      sessionData = movieData.slice(0);
      break;
    case "hindimovies":
      sessionData = hindiMoviesData.slice(0);
      break;
    case "codenames":
      sessionData = codenamesData.slice(0);
      break;
    case "custom":
      if (customData.length === 0) {
        var customWordList = prompt(
          "Please enter custom word list. The list will be saved until your refresh your browser. (The words MUST be delimanted by spaces). eg: cat dog mouse",
          "Enter words here"
        );
        customData = customWordList.split(" ");
      }
      sessionData = customData.slice(0);
      break;
    default:
      sessionData = defaultData.slice(0);
  }

  wordsSelected = [];
  teams = [];
  spyMasterMode = false;
  document.getElementById("board").innerHTML = "";

  //fire new board
  updateScore();
  createNewGame();
}

//not used, but probably useful at some point
function removeItem(array, index) {
  if (index > -1) {
    // console.log("index: " + index + ", word: " + array[index] + " removed.");
    array.splice(index, 1);
  }
}

function createNewGame() {
  //create teams
  for (var i = 0; i < 8; i++) {
    teams.push("red");
    teams.push("blue");
  }

  // one extra for one of the teams
  if (Math.floor(Math.random() * data.length) % 2 === 0) {
    teams.push("red");
    // document.getElementById("team").style.color = COLOR_RED;
    // document.getElementById("team").innerHTML = "RED";
    $("#board")
      .addClass("redStarts")
      .removeClass("blueStarts");
  } else {
    teams.push("blue");
    // document.getElementById("team").style.color = COLOR_BLUE;
    // document.getElementById("team").innerHTML = "BLUE";
    $("#board")
      .addClass("blueStarts")
      .removeClass("redStarts");
  }

  // add neturals
  for (var i = 0; i < 7; i++) {
    teams.push("yellow");
  }

  // push the assasin
  teams.push("black");

  //shuffle teams
  shuffle(teams);

  var trs = [];
  for (var i = 0; i < NUMBER_OF_WORDS; i++) {
    if (!trs[i % 5]) {
      trs[i % 5] = "";
    }
    var randomNumber = Math.floor(Math.random() * sessionData.length);
    var word = sessionData[randomNumber];
    removeItem(sessionData, randomNumber);

    wordsSelected.push(word);
    trs[i % 5] +=
      '<div class="word" id=\'' +
      i +
      "' onclick=\"clicked('" +
      i +
      '\')"><div><a href="#"' +
      " alt-text=" +
      teams[i] +
      ' ><span class="ada" ></span>' +
      word +
      "</a></div></div>";
  }
  //<a href="#"><span class="ada">Washington stimulates economic growth </span>Read me</a>
  for (var i = 0; i < trs.length; i++) {
    document.getElementById("board").innerHTML +=
      '<div class="row">' + trs[i] + "</div>";
  }

  updateScore();
}

function clicked(value) {
  if (spyMasterMode) {
    //spymaster mode
    document.getElementById(value).style.backgroundColor = colors.green;
  } else {
    //guessers mode
    var word = wordsSelected[value];
    if (document.getElementById("confirm").checked) {
      if (window.confirm("Are sure you want to select '" + word + "'?")) {
        document.getElementById(value).style.backgroundColor =
          colors[teams[value]];
        if (colors[teams[value]] == "black") {
          document.getElementById(value).style.color = "white";
        }
      }
    } else {
      document.getElementById(value).style.backgroundColor =
        colors[teams[value]];
      if (colors[teams[value]] == "black") {
        document.getElementById(value).style.color = "white";
      }
    }
  }
  updateScore();
}

function updateScore() {
  var blueScore = 9;
  var redScore = 9;
  if (spyMasterMode) {
    blueScore = 0;
    redScore = 0;
    $("div.word").each(function() {
      var color = $(this).css("background-color");
      if (color === "rgb(84, 120, 177)") {
        blueScore++;
      }
      if (color === "rgb(202, 64, 95)") {
        redScore++;
      }
    });
  } else {
    $("div.word").each(function() {
      var color = $(this).css("background-color");
      if (color === "rgb(84, 120, 177)") {
        blueScore--;
      }
      if (color === "rgb(202, 64, 95)") {
        redScore--;
      }
    });

    if ($(".redStarts").length === 1) {
      blueScore--;
    } else {
      redScore--;
    }
  }
  $("#redScore").text(redScore);
  $("#blueScore").text(blueScore);
  if (redScore === 0) {
    $("#redScore").text("Winner!");
  }
  if (blueScore === 0) {
    $("#blueScore").text("Winner!");
  }
}

function spyMaster() {
  //TODO: randomize or organize tiles for easier comparing
  spyMasterMode = true;
  for (var i = 0; i < NUMBER_OF_WORDS; i++) {
    document.getElementById(i).style.backgroundColor = colors[teams[i]];
    if (colors[teams[i]] == "black") {
      document.getElementById(i).style.color = "white";
    }
  }
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


function setupCast() {
  $("#seed").hide();
  $("#spymaster").hide();
  $("#gameMode").hide();
  $("#reset").hide();
  $("#confirmText").hide();
  $("#confirm").hide();
  $("#cast").hide();

  var gamemode = GAME_MODES.indexOf($("#gameMode :selected").val());
  var url = document.location
    .toString()
    .split("#")[0]
    .split("?")[0];
  if (gamemode > 0) {
    url += "?gm=" + gamemode;
  }
  url += "#" + $("#seed").val();

  let instructions =
    "Please visit " + url + " and click the Spymaster button at the top-right";

  copyToClipboard(instructions).then(
    function() {
      alert(
        "Instructions copied to the Clipboard. Paste on a chat only to the Spymasters"
      );
    },
    function(err) {
      alert(
        "Please send the following link to the spymasters: " +
          url +
          "and ask them to click the Spymaster button"
      );
    }
  );
}


//enable pressing 'Enter' on seed field
document.getElementById("seed").onkeypress = function(e) {
  if (!e) e = window.event;
  var keyCode = e.keyCode || e.which;
  if (keyCode == "13") {
    // Enter pressed
    fire();
    return false;
  }
};
