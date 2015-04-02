function handleFileSelect(e)
{
	var file = e.target.files[0];

	cleanMapViewerState();

	var reader = new FileReader();

	reader.onloadend = function(e) {
		if(e.target.readyState == FileReader.DONE)
		{
			data = e.target.result;
			if(parseMapData()) {
				hideAllElements();
				drawMap();
			}
		}
		
	};

	reader.readAsBinaryString(file);
};

document.getElementById("mapfile").addEventListener("change", handleFileSelect, false);
document.getElementById("jbo").addEventListener("click", function() { loadMapFromServer("maps/jamesbox.rbe"); }, false);
document.getElementById("jbb").addEventListener("click", function() { loadMapFromServer("maps/jamesboxbox.rbe"); }, false);
document.getElementById("hng").addEventListener("click", function() { loadMapFromServer("maps/hangar.rbe"); }, false);