
function fanSpeed(value){

	switch (value) {

		case ('0'):
			value = 0;
			break;

		case ('1'):
			value = 10;
			break;

		case ('2'):
			value = 20;
			break;

		case ('4'):
			value = 30;
			break;

		case ('5'):
			value = 40;
			break;

		case ('7'):
			value = 50;
			break;

		case ('9'):
			value = 60;
			break;

		case ('10'):
			value = 70;
			break;

		case ('12'):
			value = 80;
			break;

		case ('13'):
			value = 90;
			break;

		case ('15'):
			value = 100;
			break;
	}

	return value;

}

function stageParser(value){

	switch (value) {
		case -2:
			return 'Offline';
		case -1:
			return 'Idle';
		case 0:
			return 'Printing';  // idle or printing
		case 1:
			return 'Auto bed leveling';
		case 2:
			return 'Heatbed preheating';
		case 3:
			return 'Sweeping XY mech mode';
		case 4:
			return 'Changing filament';
		case 5:
			return 'M400 pause';
		case 6:
			return 'Paused due to filament runout';
		case 7:
			return 'Heating hotend';
		case 8:
			return 'Calibrating extrusion';
		case 9:
			return 'Scanning bed surface';
		case 10:
			return 'Inspecting first layer';
		case 11:
			return 'Identifying build plate type';
		case 12:
			return 'Calibrating Micro Lidar';
		case 13:
			return 'Homing toolhead';
		case 14:
			return 'Cleaning nozzle tip';
		case 15:
			return 'Checking extruder temperature';
		case 16:
			return 'Printing was paused by the user';
		case 17:
			return 'Pause of front cover falling';
		case 18:
			return 'Calibrating the micro lidar';
		case 19:
			return 'Calibrating extrusion flow';
		case 20:
			return 'Paused due to nozzle temperature malfunction';
		case 21:
			return 'Paused due to heat bed temperature malfunction';
		default:
			return value.toString();
	}

}

function speedProfile(value){
	if (value === undefined) {
		return '';
	}
	switch (value) {
		case 1:
			return 'Silent';

		case 2:
			return 'Standard';

		case 3:
			return 'Sport';

		case 4:
			return 'Ludicrous';

		default:
			return 'Undefined';
	}
}

function remainingTime(value){

	let hour = Math.floor((value% 3600) / 60);
	let minute = Math.floor(value % 60);

	//Den String von Stunden, Minuten und Sekunden auf 2 Stellen ändern
	if (hour < 10) {
		hour = '0' + hour;
	}

	if (minute < 10) {
		minute = '0' + minute;
	}


	value = hour + ':' + minute;

	return value;
}


module.exports = {
	fanSpeed,
	stageParser,
	speedProfile,
	remainingTime
};