const path = require('path');
const { readFile } = require('fs.promised');
const getWritableDirectory = require('@vercel/build-utils/fs/get-writable-directory'); // eslint-disable-line import/no-extraneous-dependencies
const download = require('@vercel/build-utils/fs/download'); // eslint-disable-line import/no-extraneous-dependencies
const glob = require('@vercel/build-utils/fs/glob'); // eslint-disable-line import/no-extraneous-dependencies
const { createLambda } = require('@vercel/build-utils/lambda'); // eslint-disable-line import/no-extraneous-dependencies
const vanillaGlob_ = require('glob');
export type GlobOptions = vanillaGlob_.IOptions;

const {
  log,
  pip,
  python,
  linux,
} = require('./build-utils');


const DEFAULT_PYTHON_VERSION = 'python3.9';

exports.config = {
  maxLambdaSize: '15mb',
};


exports.build = async ({ workPath,
  files: originalFiles,
  entrypoint,
  meta = {},
  config }) => {
  log.info(`Files: ${JSON.stringify(files)}`);
  log.title('Starting build');
  const systemReleaseContents = await readFile(
    path.join('/etc', 'system-release'),
    'utf8',
  );
  log.info(`Build AMI version: ${systemReleaseContents.trim()}`);

  const runtime = config.runtime || DEFAULT_PYTHON_VERSION;
  python.validateRuntime(runtime);
  log.info(`Lambda runtime: ${runtime}`);

  const wsgiMod = entrypoint.split('.').shift().replace(/\//g, '.');
  const wsgiApplicationName = config.wsgiApplicationName || 'application';
  const wsgiApplication = `${wsgiMod}.${wsgiApplicationName}`;
  log.info(`WSGI application: ${wsgiApplication}`);

  log.heading('Selecting python version');
  const pythonBin = await python.findPythonBinary(runtime);
  const pyUserBase = await getWritableDirectory();
  process.env.PYTHONUSERBASE = pyUserBase;

  log.heading('Installing pip');
  const pipPath = await pip.downloadAndInstallPip(pythonBin);

  log.heading('Downloading project');
  const srcDir = await getWritableDirectory();
  // eslint-disable-next-line no-param-reassign
  files = await download(files, srcDir);
  process.env.srcDir = srcDir;
  log.heading('Installing handler');
  await pip.install(pipPath, srcDir, __dirname);

  log.heading('Running setup script');
  let setupPath = linux.findRequirements(entrypoint, files);
  if (setupPath) {
    await linux.install(setupPath);
  }

  log.heading('Running pip script');
  const requirementsTxtPath = pip.findRequirements(entrypoint, files);
  if (requirementsTxtPath) {
    await pip.install(pipPath, srcDir, '-r', requirementsTxtPath);
  }

  log.heading('Running post script');
  setupPath = linux.findPostRequirements(entrypoint, files);
  if (setupPath) {
    await linux.install(setupPath);
  }

  log.heading('Preparing lambda bundle');
/*
  const lambda = await createLambda({
    files: await glob('**', srcDir),
    handler: 'lambda.vercel_handler',
    runtime: `${config.runtime || DEFAULT_PYTHON_VERSION}`,
    environment: {
      WSGI_APPLICATION: `${wsgiApplication}`,
    },
  });

  log.title(config);
  return {
    [entrypoint]: lambda,
    output: config,
  };
*/
  const globOptions: GlobOptions = {
    cwd: workPath,
    ignore:
      config && typeof config.excludeFiles === 'string'
        ? config.excludeFiles
        : 'node_modules/**',
  };

  const lambda = await createLambda({
    files: await glob('**', globOptions),
    handler: 'lambda.vercel_handler',
    runtime: `${config.runtime || DEFAULT_PYTHON_VERSION}`,
    environment: {},
  });
  log.title('Done!');

  return { output: lambda };
};
