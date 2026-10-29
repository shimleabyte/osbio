(function (global) {
  'use strict';
  global.OSBioProjects = Object.freeze([
    Object.freeze({ id:'mutabaah-cli', name:'Mutabaah CLI', technologies:Object.freeze(['Go','JSON']), status:'built', statusLabel:'CLI / LOCAL-FIRST', summary:'A local-first command-line application for tracking activities and short notes in local JSON data.', focus:'Go fundamentals, command design, and local data persistence.', url:'https://github.com/shimleabyte/mutabaah-cli' }),
    Object.freeze({ id:'simpul', name:'Simpul', technologies:Object.freeze(['Go']), status:'in-progress', statusLabel:'BACKEND / IN PROGRESS', summary:'A reliability-first order and payment workflow backend concept for small-batch and pre-order sellers in Indonesia.', focus:'Explicit order transitions, idempotent payment events, stock reservation invariants, and testable domain rules. Database integration remains a planned milestone.', url:'https://github.com/shimleabyte/simpul' }),
    Object.freeze({ id:'optical-anchor-button', name:'Optical Anchor Button', technologies:Object.freeze(['React','HTML','CSS']), status:'experiment', statusLabel:'UI EXPERIMENT', summary:'A focused button component experiment with a custom eye, pointer tracking, and an awake-to-sleep interaction lifecycle.', focus:'Component states, pointer-driven motion, accessible interaction states, and reduced-motion support.', url:'https://github.com/shimleabyte/optical-anchor-button' })
  ]);
})(window);
