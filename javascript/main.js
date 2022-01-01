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
    new_row.classList.add('current');
    new_row.innerHTML = '<tr><td colspan="5">device opened!</td><td></td><td></td></tr>';
    input.onmidimessage = function(message) {
        let last_row =  document.querySelector('#events table tbody tr:last-child');
        console.log(last_row);
        let new_row = document.querySelector('#events table tbody').insertRow(-1);
        if (last_row != undefined) {
            last_row.classList.remove('current');
        }
        new_row.classList.add('current');
        new_row.innerHTML = '<tr><td style="text-align:left;padding-left:1em;">'+(Math.round(message.timeStamp)/1000)+'</td><td>'+(message.data[0]%16+1)+'</td><td>'+('0'+message.data[0].toString(16).toUpperCase()).substr(-2)+'</td><td>'+('0'+message.data[1].toString(16).toUpperCase()).substr(-2)+'</td><td>'+('0'+message.data[2].toString(16).toUpperCase()).substr(-2)+'</td><td>Note</td><td>Event</td></tr>';
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

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    let el = document.getElementById("input-select");
    el.addEventListener("click", onMIDISelect, false);
});
