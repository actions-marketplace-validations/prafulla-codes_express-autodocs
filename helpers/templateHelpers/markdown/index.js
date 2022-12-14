const createIndex = require('./createIndex');
const core = require('@actions/core');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const getBaseAPIContent = require('./getBaseAPIContent');
const generatePages = require('./generatePages');
async function generateMarkdowndocs(apis, outputBranch, docsTitle) {
  if (process.env.NODE_ENV == 'production') {
    console.log(
      '\x1b[36m',
      '\x1b[1m',
      `âšī¸ Setting up output branch ${outputBranch} ...`,
      '\x1b[0m'
    );

    const setupFreshBranch = `
    git stash 
    git config --global user.name 'express-autodocs'
    git config --global user.email 'bot@expressautodocs.xyz'
    git checkout -B ${outputBranch}
    git rm -rf .
    `;
    try {
      const { stderr } = await exec(setupFreshBranch);
      if (stderr) console.log(stderr);
      console.log(
        '\x1b[36m',
        '\x1b[1m',
        `đ Branch Setup Successful`,
        '\x1b[0m'
      );
    } catch (err) {
      core.setFailed(err.message);
    }
  }
  let output_path;
  if (process.env.NODE_ENV == 'production') {
    output_path = process.cwd() + '/docs';
    if (!fs.existsSync(output_path)) fs.mkdirSync(output_path);
  } else {
    output_path = process.cwd() + '/test_output/output';
    if (!fs.existsSync(output_path)) fs.mkdirSync(output_path);
  }
  let output_file = output_path + '/readme.md';
  let index = createIndex(apis);
  let baseContent = getBaseAPIContent(apis);
  generatePages(apis);
  const fd = fs.openSync(output_file, 'w');
  let indexPage = `# ${docsTitle}`;
  if (index) indexPage += index;
  if (baseContent) indexPage += baseContent;
  fs.writeFileSync(output_file, indexPage);
  fs.closeSync(fd);
  if (process.env.NODE_ENV == 'production') {
    console.log(
      '\x1b[36m',
      '\x1b[1m',
      `đ Deploying to ${outputBranch} ...`,
      '\x1b[0m'
    );
    const deploy = `
    git add docs
    git commit -m "Created Docs" -a
    git config --global user.email 'bot@expressautodocs.xyz'
    git push origin ${outputBranch} --force
    `;
    try {
      const { stderr } = await exec(deploy);
      if (stderr) console.log(stderr);
      console.log(
        '\x1b[36m',
        '\x1b[1m',
        `đ Docs created. Checkout ${outputBranch} branch.`,
        '\x1b[0m'
      );
    } catch (err) {
      core.setFailed(err.message);
    }
  }
}

module.exports = generateMarkdowndocs;
