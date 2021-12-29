# py-vercel [![NPM version](https://img.shields.io/npm/v/@jgtvares/py-vercel.svg)](https://www.npmjs.com/package/@jgtvares/py-vercel) [![License](https://img.shields.io/npm/l/@jgtvares/py-vercel)](https://github.com/jgtvares/py-vercel/blob/main/LICENSE.md)

## *A Vercel builder for Python WSGI applications*

## Quickstart

If you have an existing WSGI app, getting this builder to work for you is a
piece of 🍰!

### 1. Add a Vercel configuration

Add a `vercel.json` file to the root of your application:

```json
{
    "builds": [{
        "src": "index.py",
        "use": "@jgtvares/py-vercel",
        "config": { "maxLambdaSize": "15mb" }
    }]
}
```

This configuration is doing a few things in the `"builds"` part:

1. `"src": "index.py"`
   This tells Vercel that there is one entrypoint to build for. `index.py` is a
   file we'll create shortly.
2. `"use": "@jgtvares/py-vercel"`
   Tell Vercel to use this builder when deploying your application
3. `"config": { "maxLambdaSize": "15mb" }`
   Bump up the maximum size of the built application to accommodate some larger
   python WSGI libraries (like Django or Flask). This may not be necessary for
   you.

### 2. Add a Vercel entrypoint

Add `index.py` to the root of your application. This entrypoint should make
available an object named `application` that is an instance of your WSGI
application. E.g.:

```python
# For a Dango app
from django_app.wsgi import application
# Replace `django_app` with the appropriate name to point towards your project's
# wsgi.py file
```
- If you're using any database lib, like `pymysql`, you'll need to install it as a MySql module before any Django code in your `wsgi.py` file. Like this:
    ```python
    # wsgi.py
    import os
    import sys
    import pymysql # import pymysql

    pymysql.install_as_MySQLdb() # call this method before any Django import

    from django.core.wsgi import get_wsgi_application

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', '<folder_name>.settings')

    application = get_wsgi_application()
    ```

Look at your framework documentation for help getting access to the WSGI
application.

If the WSGI instance isn't named `application` you can set the
`wsgiApplicationName` configuration option to match your application's name (see
the configuration section below).

### 3. Deploy

That's it, you're ready to go:

```console
$ vercel
> Deploying python-wsgi-app
...
> Success! Deployment ready [57s]
```

## Requirements

### Linux requirements

If you need any Linux dependencies you can add a `install.sh` file at the root of your project containing the commands you want to execute inside the Lambda instance. This script is executed before Python requirements (section below). For example:

```bash
#!/bin/bash
yum install -y gcc musl-dev mysql-devel
```

You can also add a `post-install.sh` file at the root of your project to run commands after all dependencies are installed.
This script is executed after Python requirements (section below).

### Python requirements

Your project may optionally include a `requirements.txt` file to declare any
dependencies, e.g.:

```text
# requirements.txt
Django >=2.2,<2.3
```

Be aware that the builder will install `Werkzeug` as a requirement of the
handler. This can cause issues if your project requires a different version of
`Werkzeug` than the handler.

## Configuration options

### `runtime`

Select the lambda runtime. Defaults to `python3.9`.

```json
{
    "builds": [{
        "config": { "runtime": "python3.9" }
    }]
}
```

### `wsgiApplicationName`

Select the WSGI application to run from your entrypoint. Defaults to
`application`.

```json
{
    "builds": [{
        "config": { "wsgiApplicationName": "application" }
    }]
}
```

## Additional considerations

### Routing

You'll likely want all requests arriving at your deployment url to be routed to
your application. You can do this by adding a route rewrite to the Vercel
configuration:

```json
{
    "builds": [{
        "src": "index.py",
        "use": "@jgtvares/py-vercel"
    }],
    "routes" : [{
        "src" : "/(.*)", "dest":"/"
    }]
}
```

### Avoiding the `index.py` file

If having an extra file in your project is troublesome or seems unecessary, it's
also possible to configure Vercel to use your application directly, without passing
it through `index.py`.

If your WSGI application lives in `vercel_app/wsgi.py` and is named `application`,
then you can configure it as the entrypoint and adjust routes accordingly:

```json
{
    "builds": [{
        "src": "vercel_app/wsgi.py",
        "use": "@jgtvares/py-vercel"
    }],
    "routes" : [{
        "src" : "/(.*)", "dest":"/vercel_app/wsgi.py"
    }]
}
```

### Lambda environment limitations

At the time of writing, Vercel runs on AWS Lambda. This has a number of
implications on what libaries will be available to you, notably:

- PostgreSQL, so psycopg2 won't work out of the box
- MySQL, so MySQL adapters won't work out of the box either
- Sqlite, so the built-in Sqlite adapter won't be available

## Attribution

This implementation draws upon work from:

- [vercel-python-wsgi](https://github.com/jayhale/vercel-python-wsgi) by
   [@jayhale](https://github.com/jayhale)
- [py-vercel](https://github.com/PotatoHD404/py-vercel) by [@PotatoHD404](https://github.com/PotatoHD404)
