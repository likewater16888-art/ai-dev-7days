/* =============================================================================
 * js/data/en/skills.js
 * -----------------------------------------------------------------------------
 * 能力项（js/data/skills.js）的英文：name / why / jobs 三段。
 * key 规则见 js/data/en.js 顶部注释。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  if (!LX.EN) return;

  LX.EN.add({
    'sk.fs-nav.name': 'Directory navigation and paths',
    'sk.fs-nav.why': 'You can say where you are and point at a file precisely with a relative or absolute path',
    'sk.fs-nav.jobs': 'The first hurdle of every technical role: finding the data, the logs and the config',

    'sk.safe-write.name': 'Writing and copying files',
    'sk.safe-write.why': 'You know > from >> and cp from mv, so you never overwrite your own notes',
    'sk.safe-write.jobs': 'Managing data copies and archiving experiment output',

    'sk.data-inspect.name': 'Data health checks',
    'sk.data-inspect.why': 'You can state the size and label distribution of a dataset with head/wc/grep and write it into a file',
    'sk.data-inspect.jobs': 'Daily life in data and ML engineering: understand the data before talking about the model',

    'sk.perm-log.name': 'Permissions and locating things in logs',
    'sk.perm-log.why': 'You can locate an error with grep -n and line numbers, and you understand stdout/stderr and redirection',
    'sk.perm-log.jobs': 'Debugging production issues, log forensics',

    'sk.troubleshoot.name': 'Troubleshooting methodology',
    'sk.troubleshoot.why': 'You can write the three-line "symptom / cause / evidence" conclusion that someone else can verify',
    'sk.troubleshoot.jobs': 'Incident reviews, on-call response, technical communication',

    'sk.env-repro.name': 'Environment isolation and reproducibility',
    'sk.env-repro.why': 'One conda environment per project, exported as environment.yml plus a lock file so others can rebuild it',
    'sk.env-repro.jobs': 'A hard requirement for AI engineering roles: environments that rebuild, results that reproduce',

    'sk.git-basics.name': 'Version control',
    'sk.git-basics.why': 'You can walk status → add → commit → log with readable messages and a clean working tree',
    'sk.git-basics.jobs': 'The baseline of teamwork; interviews often ask how you manage experiment versions',

    'sk.gpu-observe.name': 'GPUs and VRAM observation',
    'sk.gpu-observe.why': 'You can read nvidia-smi, query individual fields, save the evidence and judge whether the model is really on the GPU',
    'sk.gpu-observe.jobs': 'The entry skill for model deployment and inference services',

    'sk.ops-cleanup.name': 'Processes and cleanup',
    'sk.ops-cleanup.why': 'You can start a service in the background, kill exactly the right process, and know that "killing it does not free VRAM at once"',
    'sk.ops-cleanup.jobs': 'Basic manners on a shared GPU box: hand the card back when you are done',

    'sk.deliver.name': 'Delivery and documentation',
    'sk.deliver.why': 'You can produce a one-page README: how to install, how to run, where the model came from, and the port stated clearly',
    'sk.deliver.jobs': 'Shipping a small AI app on your own is the line between "studying" and "employable"',

    'sk.ownership.name': 'Closing the loop on a project',
    'sk.ownership.why': 'All four capstone items pass automatically: model on disk, entry point clickable, complete docs, runtime evidence',
    'sk.ownership.jobs': 'Lets you write "independently built and delivered a working sentiment-classification demo" on your CV'
  });
})(window);
