/*
 * 3-Phase Analysis using Chart.js
 *
 * Designed by ZulNs @Gorontalo, 18 December 2020
 */

const anim3pInterval = 500;

let ctx3p = document.getElementById('chart_3p').getContext('2d');
let elmV3p = document.getElementById('voltage_3p');
let elmVpnmax = document.getElementById('voltage_pnmax');
let elmVpprms = document.getElementById('voltage_pprms');
let elmVppmax = document.getElementById('voltage_ppmax');
let elmSd3p = document.getElementById('show_dots_3p');
let elmAnim3p = document.getElementById('animate_3p');
let elmTable3p = document.getElementById('details_table_3p');
let elmExp3p = document.getElementById('explanation_3p');

let voltage3p = 220;
let vpnmax, vpnmin;
let vpprms, vppmax, vppmin;
let svpnsq, svppsq;
let vpp = [], vpnsq = [], vppsq = [];

let anim3pTimer;

elmV3p.value = voltage3p.toString();

addEvent(elmV3p, 'change', onInputChange3p);
addEvent(elmSd3p, 'click', onShowDots3p);
addEvent(elmAnim3p, 'click', onAnimate3p);

Chart.pluginService.register({
  beforeInit: chart => {
    for (i=0; i<=360; i+=15) {
      chart.config.data.labels.push(i%360);
    }
  }
});

let chart3p = new Chart(ctx3p, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Phase 1',
      data: [],
      borderColor: 'rgb(255, 63, 63)',
      fill: false
    },
    {
      label: 'Phase 2',
      data: [],
      borderColor: 'rgb(63, 255, 63)',
      fill: false
    },
    {
      label: 'Phase 3',
      data: [],
      borderColor: 'rgb(63, 63, 255)',
      fill: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0
      }
    }
  }
});

updateChart3p();

function updateChart3p() {
  let xd = chart3p.data.labels;
  let yd = chart3p.data.datasets;
  yd.forEach((val) => {
    val.data = [];
  });
  vpp = [];
  vpnsq = [];
  vppsq = [];
  vpnmax = vpnmin = vppmax = vppmin = 0;
  svpnsq = svppsq = 0;
  xd.forEach((val, idx) => {
    yd[0].data.push(fx(val));
    yd[1].data.push(fx(val-120));
    yd[2].data.push(fx(val-240));
    vpp.push(yd[0].data[idx]-yd[1].data[idx]);
    vpnsq.push(yd[0].data[idx]*yd[0].data[idx]);
    vppsq.push(vpp[idx]*vpp[idx]);
    if (idx < xd.length-1) {  //last index is belongs to next wave cycle
      svpnsq += vpnsq[idx];
      svppsq += vppsq[idx];
      vpnmax = Math.max(vpnmax, yd[0].data[idx]);
      vpnmin = Math.min(vpnmin, yd[0].data[idx]);
      vppmax = Math.max(vppmax, vpp[idx]);
      vppmin = Math.min(vppmin, vpp[idx]);
    }
  });
  chart3p.update();
  
  vpprms = Math.sqrt(svppsq/(xd.length-1));
  
  elmVpnmax.innerHTML = vpnmax.toFixed(2).toString();
  elmVpprms.innerHTML = vpprms.toFixed(2).toString();
  elmVppmax.innerHTML = vppmax.toFixed(2).toString();
  
  for (let i=0; i<=xd.length; ++i) {
    removeRow3p(0);
  }
  xd.forEach((val, idx) => {
    appendRow3p(idx);
  });
  appendSumRow3p();
}

function fx(x) {
  return Math.sin(x*Math.PI/180) * voltage3p * Math.sqrt(2);
}

function appendRow3p(idx) {
  let xd = chart3p.data.labels;
  let yd = chart3p.data.datasets;
  let elm = elmTable3p.children[0];
  let elmTr = createElement('tr');
  let col = [];
  let str;
  elm.appendChild(elmTr);
  
  col.push(xd[idx]);
  col.push(yd[0].data[idx]);
  col.push(yd[1].data[idx]);
  col.push(vpp[idx]);
  col.push(vpnsq[idx]);
  col.push(vppsq[idx]);
  col.forEach((val, idx) => {
    str = idx > 0 ? val.toFixed(2).toString() : val.toString();
    if ((idx==1 && (val==vpnmax || val==vpnmin)) ||
        (idx==2 && (val==vpnmax || val==vpnmin)) ||
        (idx==3 && (val==vppmax || val==vppmin))) {
      str = '<b>' + str + '</b>'
    }
    elmTr.appendChild(createElement('td', 'w3-right-align', str));
  });
}

function removeRow3p(idx) {
  let elm = elmTable3p.children[0];
  ++idx;
  if (elm.children.length > idx) {
    elm.removeChild(elm.children[idx]);
  }
}

function appendSumRow3p() {
  let xd = chart3p.data.labels;
  let elm = elmTable3p.children[0];
  let elmTr = createElement('tr');
  let elmTd = createElement('td', null, '<b>Sum</b>');
  let expStr = 'V<sub>&Phi;1&#8209;N&nbsp;rms</sub>&nbsp;= &radic;(';
  elmTd.colSpan = '4';
  elm.appendChild(elmTr);
  elmTr.appendChild(elmTd);
  elmTr.appendChild(createElement('td', 'w3-right-align', '<b>'+svpnsq.toFixed(2).toString()+'</b>'));
  elmTr.appendChild(createElement('td', 'w3-right-align', '<b>'+svppsq.toFixed(2).toString()+'</b>'));
  expStr += svpnsq.toFixed(2).toString() + '/' + (xd.length-1).toString() + ') = ' + (Math.sqrt(svpnsq/(xd.length-1))).toFixed(2).toString() + '&nbsp;Volts<br/><br/>';
  expStr += 'V<sub>&Phi;1&#8209;&Phi;2&nbsp;rms</sub>&nbsp;= &radic;(';
  expStr += svppsq.toFixed(2).toString() + '/' + (xd.length-1).toString() + ') = ' + (Math.sqrt(svppsq/(xd.length-1))).toFixed(2).toString() + '&nbsp;Volts<br/><br/>';
  expStr += 'V<sub>&Phi;1&#8209;N&nbsp;max</sub> = ' + vpnmax.toFixed(2).toString() + '<br/><br/>'
  expStr += 'V<sub>&Phi;1&#8209;&Phi;2&nbsp;max</sub> = ' + vppmax.toFixed(2).toString() + '<br/><br/>'
  expStr += 'V<sub>&Phi;1&#8209;N&nbsp;max</sub> and V<sub>&Phi;1&#8209;&Phi;2&nbsp;max</sub>';
  expStr += ' are &plusmn; values of highest voltage those occur in a full wave cycle.';
  expStr += '  They were in bold text on the above table.';
  elmExp3p.innerHTML = expStr;
}

function onInputChange3p() {
  let tmpV = parseFloat(elmV3p.value);
  if (isNaN(tmpV)) {
    elmV3p.value = voltage3p.toString();
    return;
  }
  voltage3p = tmpV;
  elmV3p.value = voltage3p.toString();
  updateChart3p();
}

function onShowDots3p() {
  chart3p.options.elements.point.radius = elmSd3p.checked ? 5 : 0;
  chart3p.update();
}

function onAnimate3p() {
  if (elmAnim3p.checked) {
    chart3p.options.animation.duration = 0;
    anim3pTimer = setInterval(animateChart3p, anim3pInterval);
  }
  else {
    clearInterval(anim3pTimer);
    chart3p.options.animation.duration = 1000;
  }
}

function animateChart3p() {
  let xd = chart3p.data.labels;
  let yd = chart3p.data.datasets;
  let elmTable = elmTable3p.children[0];
  let elmLastRow = elmTable.removeChild(elmTable.lastChild);
  elmTable.removeChild(elmTable.children[1]);
  let elmFirstRow = elmTable.children[1].cloneNode(true);
  elmTable.appendChild(elmFirstRow);
  elmTable.appendChild(elmLastRow);
  
  arrayShift(xd);
  arrayShift(yd[0].data);
  arrayShift(yd[1].data);
  arrayShift(yd[2].data);
  arrayShift(vpp);
  arrayShift(vpnsq);
  arrayShift(vppsq);
  
  chart3p.update();
}

function arrayShift(arr) {
  arr.shift();
  arr.push(arr[0]);
}

function addEvent(elm, evt, cb){
  if (window.addEventListener) {
    elm.addEventListener(evt, cb);
  }
  else if(elm.attachEvent) {
    elm.attachEvent('on' + evt, cb);
  }
  else elm['on' + evt] = cb;
}

function createElement(tagName, className, innerHTML) {
  let elm = document.createElement(tagName);
  if (className) {
    elm.className = className;
  }
  if(innerHTML) {
    elm.innerHTML=innerHTML;
  }
  return elm;
}
