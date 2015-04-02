var data;
var pos = 0;
var num_blocks = 0;
var num_materials = 0;
var material_names = [];
var block_x_coords = [];
var block_y_coords = [];
var block_z_coords = [];
var block_types = [];
var block_matids = [];
var block_morient = [];

var movingCamera = false;
var prevX = 0;
var prevY = 0;
var cameraMoveSpeedControl = 100;
var cameraRotationSpeedControl = 300;

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.addEventListener('mousewheel', onMouseWheel, false);
renderer.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false);
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseleave', onMouseLeave, false);
window.addEventListener('resize', onWindowResize, false);
renderer.domElement.style.display = "none";
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
var placeholder_texture = THREE.ImageUtils.loadTexture("img/panel_02.png");
var total = undefined;
var cubes = [];
var ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);
			
function hideAllElements()
{
	document.getElementById("wrapper").style.display = "none";
	document.getElementById("biglogocontainer").style.display = "none";
	document.getElementById("backbutton").style.display = "block";
	renderer.domElement.style.display = "block";
};

function showAllElements()
{
	renderer.domElement.style.display = "none";
	document.getElementById("backbutton").style.display = "none";
	document.getElementById("wrapper").style.display = "block";
	document.getElementById("biglogocontainer").style.display = "block";
};

function cleanMapViewerState() {
	data = null;
	pos = 0;
	num_blocks = 0;
	num_materials = 0;
	material_names = [];
	block_x_coords = [];
	block_y_coords = [];
	block_z_coords = [];
	block_types = [];
	block_matids = [];
	block_morient = [];
};

function loadMapFromServer(filename)
{
	cleanMapViewerState();
	var req = new XMLHttpRequest();
	req.open("GET", filename, true);
	req.responseType = "arraybuffer";

	req.onload = function() {
		var blob = new Blob([req.response]);

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

		reader.readAsBinaryString(blob);
	};

	req.send();
	
};

function loadMapFromBlob(blob)
{
	cleanMapViewerState();
	var reader = new FileReader();
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

	reader.readAsBinaryString(blob);
};

document.getElementById("backbutton").addEventListener("click", showAllElements, false);

function readChar()
{
	return data[pos++];
};

function readInt()
{
	if(data[pos + 3].charCodeAt() < 240)
		return data[pos++].charCodeAt() + data[pos++].charCodeAt() * 256 + data[pos++].charCodeAt() * 65536 + data[pos++].charCodeAt() * 16777216;
	else
		return -(4294967296 - (data[pos++].charCodeAt() + data[pos++].charCodeAt() * 256 + data[pos++].charCodeAt() * 65536 + data[pos++].charCodeAt() * 16777216)); 
};

function readString()
{
	var len = readInt();
	var name = "";
	for (var i = 0; i < len; i++)
		name += data[pos++];
	return name;
};

function throwInvalidMapFileError()
{
	alert("Invalid Reborn map file. Please select a proper one.");
};

function throwOldMapFileError()
{
	alert("This map file uses old map format which is unsupported.");
};


function parseMapData()
{
	if(readChar() != 'R')
	{
		throwInvalidMapFileError();
		return false;
	}
	if(readChar() != 'E')
	{
		throwInvalidMapFileError();
		return false;
	}
	if(readChar() != 'B')
	{
		throwInvalidMapFileError();
		return false;
	}
	if(readChar() != 'M')
	{
		throwInvalidMapFileError();
		return false;
	}

	var min_version = 5;
	var version = readInt();
	if(version < min_version)
	{
		throwOldMapFileError();
		return false;
	}
	if(readInt() != 0)
	{
		throwInvalidMapFileError();
		return false;
	}

	num_materials = readChar().charCodeAt();
	for (var i = 0; i < num_materials; i++)
		material_names[i] = readString();

	num_blocks = readInt();
	for (var i = 0; i < num_blocks; i++)
	{
		block_x_coords[i] = readInt();
		block_y_coords[i] = readInt();
		block_z_coords[i] = readInt();
		block_types[i] = readChar().charCodeAt();
		block_matids[i] = readChar().charCodeAt();
		block_morient[i] = readChar().charCodeAt();
		readChar();
	};

	return true;
};

function drawMap()
{
	camera.rotation.x = 0;
	camera.rotation.y = 0;
	if(total != undefined)
	{
		scene.remove(total);
		total.geometry.dispose();
		for (var i = 0; i < total.material.materials.length; i++)
			total.material.materials[i].dispose();
		total = undefined;
	}
	if(!cubes.length)
	{
		for (var i = 0; i < cubes.length; i++)
		{
			scene.remove(cubes[i]);
			cubes[i].geometry.dispose();
			cubes[i].material.dispose();
			cubes[i] = undefined;
		}
		cubes = [];
	}

	var mapGeometry = new THREE.Geometry();
	var materials = [];
	var center_of_mass = [0, 0, 0];
	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshLambertMaterial({ map: placeholder_texture });
	var cube = new THREE.Mesh(geometry, material);
	if(num_blocks > 5)
	{
		for (var i = 0; i < num_blocks; i++)
		{
			materials.push(material);
			center_of_mass[0] += cube.position.x = block_x_coords[i];
			center_of_mass[1] += cube.position.y = block_y_coords[i];
			center_of_mass[2] += cube.position.z = -block_z_coords[i];
			cube.updateMatrix();
			mapGeometry.merge(cube.geometry, cube.matrix);
		}
		var mapMaterials = new THREE.MeshFaceMaterial(materials);
		materials = undefined;
		total = new THREE.Mesh(mapGeometry, mapMaterials);
		mapGeometry.dispose();
		mapGeometry = undefined;
		for (var i = 0; i < mapMaterials.materials.lengtht; i++)
			mapMaterials.materials[i].dispose();
		mapMaterials = undefined;
		scene.add(total);
	}
	else
	{
		for (var i = 0; i < num_blocks; i++)
		{
			center_of_mass[0] += cube.position.x = block_x_coords[i];
			center_of_mass[1] += cube.position.y = block_y_coords[i];
			center_of_mass[2] += cube.position.z = block_z_coords[i];
			cubes.push(cube);
			scene.add(cube);
		}
	}	

	camera.position.x = center_of_mass[0] / num_blocks;
	camera.position.y = center_of_mass[1] / num_blocks + 2;
	camera.position.z = center_of_mass[2] / num_blocks;
	
	render();
};

function onMouseWheel(e)
{
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if(delta > 0)
		camera.translateZ(-2);
	else
		camera.translateZ(2);
	render();
};

function onMouseDown(e)
{
	if(!e.button)
	{
		movingCamera = true;
		prevX = e.clientX;
		prevY = e.clientY;
	}
};

function onMouseUp(e)
{
	if(!e.button)
		movingCamera = false;
};

function onMouseLeave()
{
	movingCamera = false;
};

function onMouseMove(e)
{
	if(movingCamera && !e.altKey)
	{
		camera.translateX((prevX - e.clientX) / cameraMoveSpeedControl);
		camera.translateY((e.clientY - prevY) / cameraMoveSpeedControl);
		prevX = e.clientX;
		prevY = e.clientY;
		render();
	}
	else if(movingCamera && e.altKey)
	{
		camera.rotation.y += (prevX - e.clientX) / cameraRotationSpeedControl;
		camera.rotation.x += (prevY - e.clientY) / cameraRotationSpeedControl;					
		prevX = e.clientX;
		prevY = e.clientY;
		render();
	}
};

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
	render();
};

function render()
{
	renderer.render(scene, camera);
};