var inputs;
var outputs;
var deviceId;
var statechange;
var currentProgram = 0;
var startTime = 0;


if (navigator.requestMIDIAccess) {
  console.log('This browser supports WebMIDI!');
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
  console.log('WebMIDI is not supported in this browser.');
  document.querySelector('#splash').innerHTML = 'Error: No WebMIDI support.';
}

function onMIDISuccess(midiAccess) {
  inputs = midiAccess.inputs;
  outputs = midiAccess.outputs;
  statechange = midiAccess.onstatechange;
  for (input of inputs.values()) {
    var opt = document.createElement("option");
    opt.text = input.name;
    opt.value = input.id;
    document.getElementById("input-select").add(opt);
  }
}

function onMIDISelect(e) {
  deviceId = this.options[this.selectedIndex].value;
  var input = inputs.get(deviceId);
  if (input != undefined) {
    input.open().then(onPortOpen, onPortClosed);
    let last_row =  document.querySelector('#events table tbody tr:last-child');
    let new_row = document.querySelector('#events table tbody').insertRow(-1);
    if (last_row != undefined) {
        last_row.classList.remove('current');
    }
    let selected_name = document.querySelector('#input-select option:checked').innerText;
    new_row.classList.add('current');
    new_row.innerHTML = '<tr><td colspan="7">'+selected_name+' device opened!</td></tr>';
    new_row.scrollIntoView();
    input.onmidimessage = function(message) {
        let last_row =  document.querySelector('#events table tbody tr:last-child');
        console.log(last_row);
        let new_row = document.querySelector('#events table tbody').insertRow(-1);
        if (last_row != undefined) {
            last_row.classList.remove('current');
        }
        new_row.classList.add('current');
        new_row.classList.add(get_event_class(message.data[0]));
        new_row.innerHTML = '<td>'+format_timestamp(message.timeStamp)+'</td><td>'+(message.data[0]%16+1)+'</td><td>'+('0'+message.data[0].toString(16).toUpperCase()).substr(-2)+'</td><td>'+('0'+message.data[1].toString(16).toUpperCase()).substr(-2)+'</td><td>'+('0'+message.data[2].toString(16).toUpperCase()).substr(-2)+'</td><td>'+get_note(message.data[0], message.data[1])+'</td><td>'+get_event(message.data[0],message.data[1])+'</td>';
        new_row.scrollIntoView();
    }
  }
}

function onPortOpen(device) {
    console.log('opened!');
}

function onPortClosed(device) {
    console.log('failed!');
}

function selectProgram(program) {
    console.log('selected: '+program);
    for(let i = 1; i <= 16; i++) {
        let el = document.getElementById('program-'+i);
        if (i == program) {
            sendMIDIMessage([0xC0, program]);
            el.style.backgroundColor = "green";
        } else {
            el.style.backgroundColor = "transparent";
        }
    }
}

function onMIDIFailure() {
  document.querySelector('#splash').innerHTML = 'Error: Could not access MIDI devices. Connect a device and refresh to try again.';
}

function sendMIDIMessage(sequence) {
  var output = outputs.get(deviceId);
  if (output != undefined) {
    output.send(sequence);
  }
}

function format_timestamp(timestamp) {
    let num = Math.round(timestamp);
    let seconds = Math.trunc(num / 1000);
    let microseconds = num % 1000;
    return seconds+'.'+(microseconds+'000').substr(0,3);
}

function get_note(status, data) {
    let event = Math.trunc(status/16);
    let note = '';
    let octave = Math.trunc(data/12)-1;

    if (event == 8 || event == 9 || event == 10) {
        switch (data % 12) {
        case 0: note = "C"; break;
        case 1: note = "C&#9839;/D&#9837;"; break;
        case 2: note = "D"; break;
        case 3: note = "D&#9839;/E&#9837;"; break;
        case 4: note = "E"; break;
        case 5: note = "F"; break;
        case 6: note = "F&#9839;/G&#9837;"; break;
        case 7: note = "G"; break;
        case 8: note = "G&#9839;/A&#9837;"; break;
        case 9: note = "A"; break;
        case 10: note = "A&#9839;/B&#9837;"; break;
        case 11: note = "B"; break;
        }
        return note+' '+octave;
    } else {
        return '---';
    }
}

function get_event_class(status) {
    let clazz = '';
    switch (Math.trunc(status/16)) {
        case 8: clazz = "note-off"; break;
        case 9: clazz = "note-on"; break;
        case 10: clazz = "key-aftertouch"; break;
        case 11: clazz = "control-change"; break;
        case 12: clazz = "program-change"; break;
        case 13: clazz = "channel-aftertouch"; break;
        case 14: clazz = "pitch-bend"; break;
        case 15: clazz = "system-eclusive"; break;
        default: clazz = "a-"+Math.trunc(status/16); break;
    }
    return clazz;
}

function get_event(status, data) {
    let event = '???';
    switch (Math.trunc(status/16)) {
        case 8: event = "Note Off"; break;
        case 9: event = "Note On"; break;
        case 10: event = "Key AfterTouch"; break;
        case 11: event = "Control Change"; break;
        case 12: event = "Program Change"; break;
        case 13: event = "Channel AfterTouch"; break;
        case 14: event = "Pitch Bend"; break;
        case 15: event = "System Eclusive"; break;
    }

    if (event == 'Control Change') {
        switch (data % 12) {
        case 0: event = event+": Bank Select (msb)"; break;
        case 1: event = event+": Modulation Wheel (msb)"; break;
        case 2: event = event+": Breath Controller (msb)"; break;
        case 4: event = event+": Foot Pedal (msb)"; break;
        case 5: event = event+": Portamento Time (msb)"; break;
        case 6: event = event+": Data Entry (msb)"; break;
        case 7: event = event+": Volume (msb)"; break;
        case 8: event = event+": Balance (msb)"; break;
        case 10: event = event+": Pan (msb)"; break;
        case 11: event = event+": Expression (msb)"; break;
        case 12: event = event+": Effect 1 (msb)"; break;
        case 13: event = event+": Effect 2 (msb)"; break;
        case 16: event = event+": General Purpose 1 (msb)"; break;
        case 17: event = event+": General Purpose 2 (msb)"; break;
        case 18: event = event+": General Purpose 3 (msb)"; break;
        case 19: event = event+": General Purpose 4 (msb)"; break;
        case 32: event = event+": Bank Select (lsb)"; break;
        case 33: event = event+": Modulation Wheel (lsb)"; break;
        case 34: event = event+": Breath Controller (lsb)"; break;
        case 36: event = event+": Foot Pedal (lsb)"; break;
        case 37: event = event+": Portamento Time (lsb)"; break;
        case 38: event = event+": Data Entry (lsb)"; break;
        case 39: event = event+": Volume (lsb)"; break;
        case 40: event = event+": Balance (lsb)"; break;
        case 42: event = event+": Pan (lsb)"; break;
        case 43: event = event+": Expression (lsb)"; break;
        case 44: event = event+": Effect 1 (lsb)"; break;
        case 45: event = event+": Effect 2 (lsb)"; break;
        case 48: event = event+": General Purpose 1 (lsb)"; break;
        case 49: event = event+": General Purpose 2 (lsb)"; break;
        case 50: event = event+": General Purpose 3 (lsb)"; break;
        case 51: event = event+": General Purpose 4 (lsb)"; break;
        case 64: event = event+": Damper Pedal on/off"; break;
        case 65: event = event+": Portamento on/off"; break;
        case 66: event = event+": Sostenuto Pedal on/off"; break;
        case 67: event = event+": Soft Pedal on/off"; break;
        case 68: event = event+": Legato FootSwitch"; break;
        case 69: event = event+": Hold 2"; break;
        case 70: event = event+": Sound Controller 1"; break;
        case 71: event = event+": Sound Controller 2"; break;
        case 72: event = event+": Sound Controller 3"; break;
        case 73: event = event+": Sound Controller 4"; break;
        case 74: event = event+": Sound Controller 5"; break;
        case 75: event = event+": Sound Controller 6"; break;
        case 76: event = event+": Sound Controller 7"; break;
        case 77: event = event+": Sound Controller 8"; break;
        case 78: event = event+": Sound Controller 9"; break;
        case 79: event = event+": Sound Controller 10"; break;
        case 80: event = event+": General Purpose 1"; break;
        case 81: event = event+": General Purpose 2"; break;
        case 82: event = event+": General Purpose 3"; break;
        case 83: event = event+": General Purpose 4"; break;
        case 84: event = event+": Portamento Control"; break;
        case 88: event = event+": High Res Velocity"; break;
        case 91: event = event+": Effect 1 Depth"; break;
        case 92: event = event+": Effect 2 Depth"; break;
        case 93: event = event+": Effect 3 Depth"; break;
        case 94: event = event+": Effect 4 Depth"; break;
        case 95: event = event+": Effect 5 Depth"; break;
        case 96: event = event+": (+1) Data Increment"; break;
        case 97: event = event+": (-1) Data Decrement"; break;
        case 98: event = event+": NRPN (lsb)"; break;
        case 99: event = event+": NRPN (msb)"; break;
        case 100: event = event+": RPN (lsb)"; break;
        case 101: event = event+": RPN (msb)"; break;
        case 120: event = event+": All Sound Off"; break;
        case 121: event = event+": Reset Controllers"; break;
        case 122: event = event+": Local on/off Switch"; break;
        case 123: event = event+": All Notes Off"; break;
        case 124: event = event+": Omni Mode Off"; break;
        case 125: event = event+": Omni Mode On"; break;
        case 126: event = event+": Mono Mode"; break;
        case 127: event = event+": Poly Mode"; break;
        }
    }
    return event;
}

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    let el = document.getElementById("input-select");
    el.addEventListener("click", onMIDISelect, false);
});
