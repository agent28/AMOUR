var table = document.getElementById("ct");
var dim = 30;

var resolution = 1;
var layers = [];
var numLayers = 1;
var numBlocksPerLayer = [0];
var currentIndex = 0;

var layersList = ko.observableArray([1]);
var curInd = ko.observable(1);
var hideGuide = false;

var COLOR_DEFAULT = "#919EAA";
var COLOR_HIGHLIGHTED = "#89C0F7";
var COLOR_SELECTED = "#6B4846";

var side_squared = dim * resolution * dim * resolution;
var diag = Math.ceil(Math.sqrt(2 * side_squared)) * 400;

var selected = new Array(dim);
for (var i = 0; i < dim; i++)
  selected[i] = new Array(dim);
layers.push(selected);

for (var i = 0; i < dim; i++) {
  table.insertRow(i);
  for (var j = 0; j < dim; j++)
    table.rows[i].insertCell(j);
};

var mouseDown = false;
var sx = 0;
var sy = 0;
var fx = 0;
var fy = 0;
var dx = 0;
var dy = 0;
var tx = 0;
var ty = 0;

function selectArea(e)
{ 
  for (var i = 0; i < dx; i++) {
    for (var j = 0; j < dy; j++) {
      if(!e.ctrlKey)
        selected[ty + j][tx + i] = 1;
      else if(e.ctrlKey)
        selected[ty + j][tx + i] = 0;
    };
  };
  dx = 0;
  dy = 0;
};

function colorSelected()
{
  for (var i = 0; i < dim; i++) {
    for (var j = 0; j < dim; j++) {
      if(selected[i][j])
        table.rows[i].cells[j].style.backgroundColor = COLOR_SELECTED;
      else
        table.rows[i].cells[j].style.backgroundColor = COLOR_DEFAULT;
    };
  };
};

function clearSelectedMatrix()
{
  selected = new Array(dim);
  for (var i = 0; i < dim; i++)
    selected[i] = new Array(dim);
};

$("#ct td").mousedown(function(e) {
  mouseDown = true;
  sx = $(this).parent().children().index($(this));
  sy = $(this).parent().parent().children().index($(this).parent());
  if(!e.ctrlKey)
    selected[sy][sx] = 1;
  else if(e.ctrlKey)
    selected[sy][sx] = 0;
  colorSelected();
  table.rows[sy].cells[sx].style.backgroundColor = COLOR_HIGHLIGHTED;
}).mousemove(function(e) {
  if(mouseDown)
  {
    fx = $(this).parent().children().index($(this));
    fy = $(this).parent().parent().children().index($(this).parent());
    dx = Math.abs(fx - sx) + 1;
    dy = Math.abs(fy - sy) + 1;
    colorSelected();
    if(fx < sx)
      tx = fx;
    else
      tx = sx;
    if(fy < sy)
      ty = fy;
    else
      ty = sy;
    for (var i = 0; i < dx; i++) {
      for (var j = 0; j < dy; j++) {
        table.rows[ty + j].cells[tx + i].style.backgroundColor = COLOR_HIGHLIGHTED;
      };
    };
  };
}).mouseup(function(e) {
  mouseDown = false;
  selectArea(e);
  colorSelected();
});

$(document).mousedown(function(e) {
  //e.preventDefault();
}).mouseup(function(e) {
  mouseDown = false;
  selectArea(e);
  colorSelected();
}).ready(function() { $(window).trigger("resize"); });

$("#savebutton").click(function() { saveRebornMap(); });
$("#loadeditorbutton").click(function() { saveRebornMap(true); });
$("#newlayerbutton").click(function() { newLayer(); });
$("#copycurrbutton").click(function() { copyCurrentLayer(); });
$("#deletecurrbutton").click(function() { deleteCurrentLayer(); });
$("#moveup").click(function() { moveCurrentUp(); });
$("#movedown").click(function() { moveCurrentDown(); });
$(window).resize(function() { 
  var tmp = $(window).height() - 90;
  $("#ct").width(tmp);
  $("#ct").height(tmp);
  tmp/=(dim+1);
  $("#ct").find("td").css("width", tmp).css("height", tmp);
  if(!hideGuide)
  {
    $("#info").css("top",$("#ct").find("tbody").offset().top).css("left",$("#ct").find("tbody").offset().left);
    $("#info").width($("#ct").find("tbody").outerWidth());
    $("#info").height($("#ct").find("tbody").outerHeight());
    $("#infocontent").width($("#info").width() / 3);
    $("#infocontent").css("top",$("#ct").find("tbody").height() / 2 - $("#infocontent").height()).css("left",$("#infocontent").width());
    $("#infocontent").click(function() { hideGuide = true; $("#info").css("display", "none"); });
  }
});

function changeResolution()
{
  resolution = $("#spinner").val();
  for (var i = 0; i < numLayers; i++)
    numBlocksPerLayer[i] = countBlocksInALayer(layers[i]) * resolution * resolution;
};

function moveCurrentUp()
{
  if(numLayers > 1 && currentIndex > 0)
  {
    saveToCurrent();
    var tmp = new Array(dim);
    for (var i = 0; i < dim; i++)
      tmp[i] = layers[currentIndex - 1][i].slice();

    layers[currentIndex - 1] = new Array(dim);
    for (var i = 0; i < dim; i++)
       layers[currentIndex - 1][i] = layers[currentIndex][i].slice();

    layers[currentIndex] = new Array(dim);
    for (var i = 0; i < dim; i++)
       layers[currentIndex][i] = tmp[i].slice();

    selected = new Array(dim);
    for (var i = 0; i < dim; i++)
      selected[i] = layers[currentIndex - 1][i].slice();
    colorSelected();

    curInd(currentIndex--);
  }
};


function moveCurrentDown()
{
  if((currentIndex + 1) != numLayers)
  {
    saveToCurrent();
    var tmp = new Array(dim);
    for (var i = 0; i < dim; i++)
      tmp[i] = layers[currentIndex + 1][i].slice();

    layers[currentIndex + 1] = new Array(dim);
    for (var i = 0; i < dim; i++)
       layers[currentIndex + 1][i] = layers[currentIndex][i].slice();

    layers[currentIndex] = new Array(dim);
    for (var i = 0; i < dim; i++)
       layers[currentIndex][i] = tmp[i].slice();

    selected = new Array(dim);
    for (var i = 0; i < dim; i++)
      selected[i] = layers[currentIndex + 1][i].slice();
    colorSelected();

    curInd(++currentIndex + 1);
  }
};


function saveRebornMap(loadInEditor)
{
  if(loadInEditor === undefined)
    loadInEditor = false;

  saveToCurrent();
  changeResolution();
  var numBlocks = 0;
  var x_coords = [];
  var y_coords = [];
  for (var h = 0; h < numLayers; h++) 
    for (var i = 0; i < dim; i++)
      for (var j = 0; j < dim; j++)
        if(layers[h][j][i])
          for (var k = 0; k < resolution; k++)
            for (var l = 0; l < resolution; l++) {
              x_coords.push(i * resolution + l);
              y_coords.push(j * resolution + k);
              numBlocks++;
            };

  var buffer = new ArrayBuffer((numBlocks * 4 + 20) * 4 + 31 + ("" + diag).length);
  var data = new DataView(buffer);
  var pos = 0;

  function writeString(string, numeric)
  {
    if(numeric === undefined)
      numeric = false;
    
    data.setInt32(pos, string.length, true);
    pos += 4;
    if(!numeric)
    {
      for (var i = 0; i < string.length; i++)
        data.setUint8(pos++, string.charCodeAt(i));
    }
    else
    {
      for (var i = 0; i < string.length; i++)
        data.setUint8(pos++, "0x3" + string.charAt(i));
    }
  };

  data.setUint8(pos++, "0x52"); // R
  data.setUint8(pos++, "0x45"); // E
  data.setUint8(pos++, "0x42"); // B
  data.setUint8(pos++, "0x4D"); // M
  data.setUint32(pos, 6, true);
  pos += 4;
  data.setUint32(pos, 0, true);
  pos += 4;
  data.setUint8(pos++, "0x00");

  data.setUint32(pos, numBlocks, true);
  pos += 4;

  for (var i = 0; i < numLayers; i++) {
    var tmp = 0;
    for(var k = 0; k < i; k++)
      tmp += numBlocksPerLayer[k];
    for (var j = tmp; j < (tmp + numBlocksPerLayer[i]); j++) {
      data.setInt32(pos, x_coords[j], true);
      pos += 4;
      data.setInt32(pos, -numLayers + i - 1, true);
      pos += 4;
      data.setInt32(pos, y_coords[j], true);
      pos += 4;
      data.setInt32(pos, 1, true);
      pos += 4;
    };
  };

  data.setInt32(pos, 1, true);
  pos += 4;

  writeString("light_ambient");

  var half_side = dim * resolution * 16;

  data.setFloat32(pos, half_side, true);
  pos += 4;
  data.setFloat32(pos, half_side, true);
  pos += 4;
  data.setFloat32(pos, half_side, true);
  pos += 4;

  data.setFloat32(pos, 0, true);
  pos += 4;
  data.setFloat32(pos, 0, true);
  pos += 4;
  data.setFloat32(pos, 0, true);
  pos += 4;

  data.setFloat32(pos, 0, true);
  pos += 4;
  data.setFloat32(pos, 0, true);
  pos += 4;
  data.setFloat32(pos, 0, true);
  pos += 4;

  data.setInt32(pos, 2, true);
  pos += 4;

  writeString("color");
  writeString("808080", true);

  writeString("radius");
  writeString("" + diag, true);

  var blob = new Blob([data]);
  if(loadInEditor)
  {
    loadMapFromBlob(blob);
    blob = undefined;
  }
  else
    if($("#mapname").val().replace(/[|&:*\\\/;$%@"?<>()+,]/g, ""))
      saveAs(blob, $("#mapname").val().replace(/[|&:*\\\/;$%@"?<>()+,]/g, "") + ".rbe");
    else
      saveAs(blob, "map.rbe");
};

function countBlocksInALayer(layer)
{
  var num_curr = 0;
    for (var i = 0; i < dim; i++)
        for (var j = 0; j < dim; j++)
          if(layer[j][i])
            num_curr++;

  return num_curr;
};

function newLayer()
{
  saveToCurrent();

  clearSelectedMatrix();
  layers.push(selected);
  colorSelected();
  numBlocksPerLayer.push(0);
  currentIndex = numLayers++;
  layersList.push(numLayers);
  curInd(numLayers);
};

function copyCurrentLayer()
{
  saveToCurrent();
  numBlocksPerLayer.push(0);
  var selected_cpy = new Array(dim);
  for (var i = 0; i < dim; i++)
    selected_cpy[i] = selected[i].slice();
  layers.push(selected_cpy);
  currentIndex = numLayers++;
  layersList.push(numLayers);
  curInd(numLayers);
};

function saveToCurrent()
{
  layers[currentIndex] = new Array(dim);
  for (var i = 0; i < dim; i++)
    layers[currentIndex][i] = selected[i].slice();
};

function deleteCurrentLayer()
{
  if(numLayers > 1)
  {
    layers.splice(currentIndex, 1);
    numBlocksPerLayer.splice(currentIndex, 1);
    if(currentIndex)
      layersList.splice(currentIndex--, 1);
    else
      layersList.splice(currentIndex, 1);
    for (var i = 0; i < layersList().length; i++)
      layersList.splice(i, 1, i + 1);
    curInd(--numLayers);
    selected = new Array(dim);
    for (var i = 0; i < dim; i++)
      selected[i] = layers[currentIndex][i].slice();
    colorSelected();
  }
};

function loadLayer(ind)
{
  saveToCurrent();
  currentIndex = ind;
  curInd(ind + 1);
  selected = new Array(dim);
  for (var i = 0; i < dim; i++)
    selected[i] = layers[ind][i].slice();
  colorSelected();
};

var showTooltips = true;
$("#togglett").change(function() { showTooltips = !showTooltips; });
var tooltipItems = ["layerslist", "layernumber", "moveup", "movedown", "newlayerbutton", "copycurrbutton", "deletecurrbutton", "spinnerlbl", "spinner", "savebutton", "loadeditorbutton", "mapnamelbl", "mapname"];
var emPx = Number(getComputedStyle(document.getElementById("mapname"), "").fontSize.match(/(\d*(\.\d*)?)px/)[1] * Math.sqrt(2)) ? Number(getComputedStyle(document.getElementById("mapname"), "").fontSize.match(/(\d*(\.\d*)?)px/)[1] * Math.sqrt(2)) : 16;
var ttposx = $("#layerslist").offset().left + $("#layerslist").width() + emPx / 2 + 3;
for (var i = 0; i < tooltipItems.length; i++) {
  $("body").append("<div class='tooltip' id='" + tooltipItems[i] + "-tooltip'><div class='tthead'></div>" + $("#" + tooltipItems[i]).attr('title') + "</div>");
  $("#" + tooltipItems[i]).removeAttr('title');
  $("#" + tooltipItems[i] + "-tooltip").css("left", ttposx).css("top", $("#" + tooltipItems[i]).offset().top + ($("#" + tooltipItems[i]).outerHeight() - $("#" + tooltipItems[i] + "-tooltip").outerHeight()) / 2);
  $("#" + tooltipItems[i]).mouseenter(function()
    {
      if(showTooltips) $("#" + this.id + "-tooltip").stop(true, true).delay(1000).fadeIn(200);
    }).mouseleave(function(){
      $("#" + this.id + "-tooltip").stop(true, true).fadeOut(200);
    });
};

ko.applyBindings({ layers: layersList, currentLayer: curInd});