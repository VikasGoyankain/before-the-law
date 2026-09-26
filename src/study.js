/* Dev harness: the three-stage scene study. Not the game. */
import { stage, snap } from './scene.js';
window.setStage = stage;
window.snapStage = function(n){ snap(n); var b=document.querySelectorAll(String.fromCharCode(35)+"ctl button"); for(var i=0;i<b.length;i++) b[i].classList.toggle("on", +b[i].dataset.s===n); };
const btns = document.querySelectorAll('#ctl button');
for (let i = 0; i < btns.length; i++) {
  btns[i].addEventListener('click', function () {
    stage(+this.dataset.s);
    for (let j = 0; j < btns.length; j++) btns[j].classList.toggle('on', btns[j] === this);
  });
}
